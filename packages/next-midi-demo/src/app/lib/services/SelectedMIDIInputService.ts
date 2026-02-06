import { EMIDIAccess, type EMIDIInput } from 'effect-web-midi'

import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { reactivelySchedule } from '../helpers/reactiveFiberScheduler.ts'

export class SelectedMIDIInputService extends Effect.Service<SelectedMIDIInputService>()(
  'SelectedMIDIInputService',
  {
    accessors: true,
    dependencies: [EMIDIAccess.layerSoftwareSynthSupported],
    scoped: Effect.gen(function* () {
      const selectedInputIdRef =
        yield* SubscriptionRef.make<EMIDIInput.Id | null>(null)

      yield* reactivelySchedule(
        EMIDIAccess.makeAllPortsStateChangesStreamInContext(),
        ({ port, newState }) =>
          SubscriptionRef.update(selectedInputIdRef, selectedId =>
            port.id === selectedId && newState.ofDevice === 'disconnected'
              ? null
              : selectedId,
          ),
      )

      return {
        selectInput: (id: EMIDIInput.Id) =>
          SubscriptionRef.set(selectedInputIdRef, id),

        changes: Stream.changes(selectedInputIdRef.changes),
      }
    }),
  },
) {}
