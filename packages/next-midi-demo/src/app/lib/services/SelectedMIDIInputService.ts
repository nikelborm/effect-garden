import { EMIDIAccess, type EMIDIInput } from 'effect-web-midi'

import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

export class SelectedMIDIInputService extends Effect.Service<SelectedMIDIInputService>()(
  'SelectedMIDIInputService',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const selectedInputIdRef =
        yield* SubscriptionRef.make<EMIDIInput.Id | null>(null)

      yield* EMIDIAccess.makeAllPortsStateChangesStreamInContext().pipe(
        Stream.mapEffect(
          ({ port, newState }) =>
            SubscriptionRef.update(selectedInputIdRef, selectedId =>
              port.id === selectedId && newState.ofDevice === 'disconnected'
                ? null
                : selectedId,
            ),
          { concurrency: 1 },
        ),
        Stream.runDrain,
        Effect.forkScoped,
      )

      return {
        selectInput: (id: EMIDIInput.Id) =>
          SubscriptionRef.set(selectedInputIdRef, id),

        changes: Stream.changes(selectedInputIdRef.changes),
      }
    }),
  },
) {}
