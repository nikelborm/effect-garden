import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'

import * as Context from 'effect/Context'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import type * as Scope from 'effect/Scope'

export interface DeferredMIDIAccessServiceShape {
  readonly accessOption: Effect.Effect<
    Option.Option<EMIDIAccess.Instance>,
    never
  >
}

export class DeferredMIDIAccessService extends Context.Service<
  DeferredMIDIAccessService,
  DeferredMIDIAccessServiceShape
>()('next-midi-demo/DeferredMIDIAccessService') {
  static readonly accessOptionInContext = Effect.flatMap(
    Effect.serviceOption(DeferredMIDIAccessService),
    Option.match({
      onNone: () => Effect.succeedNone,
      onSome: service => service.accessOption,
    }),
  )
}

export const layer = (
  config?: Readonly<EMIDIAccess.RequestMIDIAccessOptions>,
) =>
  Effect.gen(function* (): Effect.gen.Return<
    DeferredMIDIAccessServiceShape,
    never,
    Scope.Scope
  > {
    const requestedConfig = { software: true, sysex: true, ...config }
    const deferred = yield* Deferred.make<Option.Option<EMIDIAccess.Instance>>()

    yield* EMIDIAccess.request(requestedConfig).pipe(
      Effect.tapCause(cause =>
        Effect.logWarning(
          'MIDI access was not granted, all MIDI features are no-op',
          cause,
        ),
      ),
      Effect.option,
      Deferred.into(deferred),
      Effect.forkScoped,
    )

    const awaitedAccessOption = Deferred.await(deferred)

    return { accessOption: awaitedAccessOption }
  }).pipe(Layer.effect(DeferredMIDIAccessService))

export const DeferredMIDIAccessServiceLayer = layer()
