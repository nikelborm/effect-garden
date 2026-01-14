import * as Context from 'effect/Context'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as Schedule from 'effect/Schedule'

export type AudioPlayback = {
  readonly bufferSource: AudioBufferSourceNode
  readonly gainNode: GainNode
}

export type AudioState =
  | { readonly _tag: 'NotPlaying' }
  | { readonly _tag: 'PlayingAsset'; readonly current: AudioPlayback }
  | {
      readonly _tag: 'ScheduledChange'
      readonly current: AudioPlayback
      readonly next: AudioPlayback
      readonly cleanupFiber: any
    }

export class AudioService extends Context.Tag('AudioService')<
  AudioService,
  {
    readonly play: (buffer: AudioBuffer) => Effect.Effect<void>
    readonly stop: () => Effect.Effect<void>
  }
>() {}

export const AudioServiceLive = Layer.effect(
  AudioService,
  Effect.gen(function* () {
    const audioContext = new AudioContext()
    const state = yield* Ref.make<AudioState>({ _tag: 'NotPlaying' })
    const fadeTime = 0.1 // seconds

    const createPlayback = (buffer: AudioBuffer): AudioPlayback => {
      const bufferSource = audioContext.createBufferSource()
      const gainNode = audioContext.createGain()
      bufferSource.buffer = buffer
      bufferSource.connect(gainNode)
      gainNode.connect(audioContext.destination)
      return { bufferSource, gainNode }
    }

    const cleanupPlayback = (playback: AudioPlayback) =>
      Effect.sync(() => {
        playback.bufferSource.stop()
        playback.bufferSource.disconnect()
        playback.gainNode.disconnect()
      })

    const play = (buffer: AudioBuffer) =>
      Ref.get(state).pipe(
        Effect.flatMap(currentStatus =>
          Effect.gen(function* () {
            switch (currentStatus._tag) {
              case 'NotPlaying': {
                const playback = createPlayback(buffer)
                playback.gainNode.gain.setValueAtTime(
                  1,
                  audioContext.currentTime,
                )
                playback.bufferSource.start()
                yield* Ref.set(state, {
                  _tag: 'PlayingAsset' as const,
                  current: playback,
                })
                break
              }

              case 'PlayingAsset': {
                {
                  const nextPlayback = createPlayback(buffer)
                  const oldPlayback = currentStatus.current

                  oldPlayback.gainNode.gain.exponentialRampToValueAtTime(
                    0.001,
                    audioContext.currentTime + fadeTime,
                  )
                  nextPlayback.gainNode.gain.setValueAtTime(
                    0.001,
                    audioContext.currentTime,
                  )
                  nextPlayback.gainNode.gain.exponentialRampToValueAtTime(
                    1,
                    audioContext.currentTime + fadeTime,
                  )
                  nextPlayback.bufferSource.start()

                  const cleanupFiber = yield* EFunction.pipe(
                    cleanupPlayback(oldPlayback).pipe(
                      Effect.delay(Duration.seconds(fadeTime + 0.1)),
                      Effect.zipRight(
                        Ref.update(state, s =>
                          s._tag === 'ScheduledChange'
                            ? {
                                _tag: 'PlayingAsset' as const,
                                current: nextPlayback,
                              }
                            : s,
                        ),
                      ),
                      Effect.fork,
                    ),
                  )

                  yield* Ref.set(state, {
                    _tag: 'ScheduledChange' as const,
                    current: oldPlayback,
                    next: nextPlayback,
                    cleanupFiber,
                  })
                }
                break
              }

              case 'ScheduledChange': {
                // yield* Effect.interrupt(currentStatus.cleanupFiber)

                yield* cleanupPlayback(currentStatus.next)

                const newNextPlayback = createPlayback(buffer)
                const current = currentStatus.current

                current.gainNode.gain.cancelScheduledValues(
                  audioContext.currentTime,
                )
                current.gainNode.gain.exponentialRampToValueAtTime(
                  0.001,
                  audioContext.currentTime + fadeTime,
                )

                newNextPlayback.gainNode.gain.setValueAtTime(
                  0.001,
                  audioContext.currentTime,
                )
                newNextPlayback.gainNode.gain.exponentialRampToValueAtTime(
                  1,
                  audioContext.currentTime + fadeTime,
                )
                newNextPlayback.bufferSource.start()

                const newFiber = yield* cleanupPlayback(current).pipe(
                  Effect.delay(Duration.seconds(fadeTime + 0.1)),
                  Effect.zipRight(
                    Ref.update(state, () => ({
                      _tag: 'PlayingAsset' as const,
                      current: newNextPlayback,
                    })),
                  ),
                  Effect.fork,
                )

                yield* Ref.set(state, {
                  _tag: 'ScheduledChange',
                  current: current,
                  next: newNextPlayback,
                  cleanupFiber: newFiber,
                })
                break
              }
            }
          }),
        ),
      )

    const stop = () =>
      Ref.getAndSet(state, { _tag: 'NotPlaying' }).pipe(
        Effect.flatMap(s => {
          if (s._tag === 'NotPlaying') return Effect.void

          const nodes =
            s._tag === 'PlayingAsset' ? [s.current] : [s.current, s.next]
          return Effect.forEach(
            nodes,
            p => {
              p.gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                audioContext.currentTime + fadeTime,
              )
              return cleanupPlayback(p).pipe(
                Effect.delay(Duration.seconds(fadeTime + 0.1)),
              )
            },
            { discard: true },
          )
        }),
      )

    return { play, stop }
  }),
)
