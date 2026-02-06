import * as Context from 'effect/Context'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as Schedule from 'effect/Schedule'

export class AppPlaybackStateService extends Effect.Service<AppPlaybackStateService>()(
  'next-midi-demo/AppPlaybackStateService',
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const audioContext = new AudioContext()
      const state = yield* Ref.make<AppPlaybackState>({ _tag: 'NotPlaying' })
      const fadeTime = 0.1 // seconds

      const arrayOfCleanupFibers = []
      // TODO: fill
      // TODO: add internal cleanup stage, so that if a user click during cleanup, it's properly handled?

      // audioContext.decodeAudioData()

      const createSilentByDefaultPlayback = () => {}

      const play = Effect.fn(function* (buffer: AudioBuffer) {
        const currentStatus = yield* Ref.get(state)
        switch (currentStatus._tag) {
          case 'NotPlaying':
            return yield* Ref.set(state, {
              _tag: 'PlayingAsset' as const,
              current: yield* createImmediatelyLoudPlayback(
                audioContext,
                buffer,
              ),
              playbackStartedAtSecond: audioContext.currentTime,
            })
          case 'PlayingAsset': {
            // const nextPlayback = createPlayback(buffer)
            // const oldPlayback = currentStatus.current
            // oldPlayback.gainNode.gain.exponentialRampToValueAtTime(
            //   0.001,
            //   audioContext.currentTime + fadeTime,
            // )
            // nextPlayback.gainNode.gain.setValueAtTime(
            //   0.001,
            //   audioContext.currentTime,
            // )
            // nextPlayback.gainNode.gain.exponentialRampToValueAtTime(
            //   1,
            //   audioContext.currentTime + fadeTime,
            // )
            // nextPlayback.bufferSource.start()
            // const cleanupFiber = yield* Effect.sleep(
            //   Duration.seconds(fadeTime + 0.1),
            // ).pipe(
            //   Effect.tap(() => cleanupPlayback(oldPlayback)),
            //   Effect.zipRight(
            //     Ref.update(state, s =>
            //       s._tag === 'ScheduledChange'
            //         ? {
            //             _tag: 'PlayingAsset' as const,
            //             current: nextPlayback,
            //           }
            //         : s,
            //     ),
            //   ),
            //   Effect.fork,
            // )
            // yield* Ref.set(state, {
            //   _tag: 'ScheduledChange' as const,
            //   current: oldPlayback,
            //   next: nextPlayback,
            //   cleanupFiber,
            // })

            break
          }
          case 'ScheduledChange': {
            yield* Fiber.interrupt(currentStatus.cleanupFiber)
            yield* cleanupPlayback(currentStatus.next)
            // const newNextPlayback = createPlayback(buffer)
            // const current = currentStatus.current
            // current.gainNode.gain.cancelScheduledValues(audioContext.currentTime)
            // current.gainNode.gain.exponentialRampToValueAtTime(
            //   0.001,
            //   audioContext.currentTime + fadeTime,
            // )
            // newNextPlayback.gainNode.gain.setValueAtTime(
            //   0.001,
            //   audioContext.currentTime,
            // )
            // newNextPlayback.gainNode.gain.exponentialRampToValueAtTime(
            //   1,
            //   audioContext.currentTime + fadeTime,
            // )
            // newNextPlayback.bufferSource.start()
            // const newFiber = yield* cleanupPlayback(current).pipe(
            //   Effect.delay(Duration.seconds(fadeTime + 0.1)),
            //   Effect.zipRight(
            //     Ref.update(state, () => ({
            //       _tag: 'PlayingAsset' as const,
            //       current: newNextPlayback,
            //     })),
            //   ),
            //   Effect.fork,
            // )
            // yield* Ref.set(state, {
            //   _tag: 'ScheduledChange',
            //   current: current,
            //   next: newNextPlayback,
            //   cleanupFiber: newFiber,
            // })
            break
          }
        }
      })

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

      const isPlaying = Effect.map(
        Ref.get(state),
        current => current._tag !== 'NotPlaying',
      )

      return { play, stop, isPlaying }
    }),
  },
) {}

const createPlayback = (audioContext: AudioContext, buffer: AudioBuffer) =>
  Effect.sync(() => {
    const bufferSource = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()
    bufferSource.buffer = buffer
    bufferSource.connect(gainNode)

    gainNode.connect(audioContext.destination)

    return { bufferSource, gainNode }
  })

const createImmediatelyLoudPlayback = (
  audioContext: AudioContext,
  buffer: AudioBuffer,
) =>
  Effect.map(createPlayback(audioContext, buffer), pb => {
    pb.gainNode.gain.setValueAtTime(1, audioContext.currentTime)
    pb.bufferSource.start()
    return pb
  })

const getAbsoluteNextTick = (
  audioContext: AudioContext,
  secondsThatHavePassedFromAudioContextInitWhenPlaybackStarted: number,
) => {
  const secondsPassedSincePlaybackStart =
    audioContext.currentTime -
    secondsThatHavePassedFromAudioContextInitWhenPlaybackStarted
}

const silencePlaybackAtNextTick = () => []

const createInitiallySilentPlaybackWithScheduledLoudnessIncrease = (
  audioContext: AudioContext,
  buffer: AudioBuffer,
  playbackStartedAtSecond: number,
) =>
  Effect.map(createPlayback(audioContext, buffer), pb => {
    pb.gainNode.gain.setValueAtTime(1, playbackStartedAtSecond)
    pb.bufferSource.start()
    return pb
  })

const cleanupPlayback = ({ bufferSource, gainNode }: AudioPlayback) =>
  Effect.sync(() => {
    bufferSource.stop()
    bufferSource.disconnect()
    gainNode.disconnect()
  })
export type AudioPlayback = {
  readonly bufferSource: AudioBufferSourceNode
  readonly gainNode: GainNode
}

export type AppPlaybackState =
  | { readonly _tag: 'NotPlaying' }
  | {
      readonly _tag: 'PlayingAsset'
      readonly playbackStartedAtSecond: number
      readonly current: AudioPlayback
    }
  | {
      readonly _tag: 'ScheduledChange'
      readonly playbackStartedAtSecond: number
      readonly current: AudioPlayback
      readonly next: AudioPlayback
      readonly cleanupFiber: Fiber.RuntimeFiber<void, never>
    }
