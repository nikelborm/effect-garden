import { EMIDIAccess, type EMIDIInput } from 'effect-web-midi'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import { flow } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { DeferredMIDIAccessService } from './DeferredMIDIAccessService.ts'

export class SelectedMIDIInputService extends Context.Service<SelectedMIDIInputService>()(
  'next-midi-demo/app/services/SelectedMIDIInputService',
  {
    make: Effect.gen(function* () {
      const selectedInputIdRef =
        yield* SubscriptionRef.make<EMIDIInput.Id | null>(null)

      yield* DeferredMIDIAccessService.accessOptionInContext.pipe(
        Effect.flatMap(
          Option.match({
            onSome: flow(
              EMIDIAccess.makeAllPortsStateChangesStream(),
              Stream.runForEach(({ port, newState }) =>
                SubscriptionRef.update(selectedInputIdRef, selectedId =>
                  port.id === selectedId && newState.ofDevice === 'disconnected'
                    ? null
                    : selectedId,
                ),
              ),
            ),
            onNone: () => Effect.void,
          }),
        ),
        Effect.forkScoped,
      )

      const changes = yield* SubscriptionRef.changes(selectedInputIdRef).pipe(
        Stream.changes,
        Stream.broadcast({ capacity: 'unbounded', replay: 1 }),
      )

      return {
        selectInput: (id: EMIDIInput.Id) =>
          Effect.flatMap(
            DeferredMIDIAccessService.accessOptionInContext,
            Option.match({
              onSome: () => SubscriptionRef.set(selectedInputIdRef, id),
              onNone: () =>
                Effect.die(
                  new Error(
                    'MIDI access is not granted. Selecting input id is no-op',
                  ),
                ),
            }),
          ),

        changes,
      }
    }).pipe(Effect.withSpan('SelectedMIDIInputService.init')),
  },
) {}

export const SelectedMIDIInputServiceLayer: Layer.Layer<SelectedMIDIInputService> =
  Layer.effect(SelectedMIDIInputService, SelectedMIDIInputService.make)
