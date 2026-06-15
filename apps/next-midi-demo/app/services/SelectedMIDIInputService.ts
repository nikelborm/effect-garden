import { EMIDIAccess, type EMIDIInput } from 'effect-web-midi'

import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

export class SelectedMIDIInputService extends Effect.Service<SelectedMIDIInputService>()(
  'next-midi-demo/SelectedMIDIInputService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const selectedInputIdRef =
        yield* SubscriptionRef.make<EMIDIInput.Id | null>(null)

      const access = yield* Effect.serviceOption(EMIDIAccess.EMIDIAccess)

      if (Option.isNone(access))
        return {
          selectInput: () =>
            Effect.dieMessage(
              'MIDI access is not granted. Selecting input id is no-op',
            ),
          changes: Stream.succeed(null),
        }

      yield* EMIDIAccess.makeAllPortsStateChangesStream(access.value).pipe(
        Stream.tap(({ port, newState }) =>
          SubscriptionRef.update(selectedInputIdRef, selectedId =>
            port.id === selectedId && newState.ofDevice === 'disconnected'
              ? null
              : selectedId,
          ),
        ),
        Stream.runDrain,
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped,
      )

      const changes = yield* selectedInputIdRef.changes.pipe(
        Stream.changes,
        Stream.rechunk(1),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      return {
        selectInput: (id: EMIDIInput.Id) =>
          SubscriptionRef.set(selectedInputIdRef, id),

        changes,
      }
    }).pipe(Effect.withSpan('SelectedMIDIInputService.init')),
  },
) {}
