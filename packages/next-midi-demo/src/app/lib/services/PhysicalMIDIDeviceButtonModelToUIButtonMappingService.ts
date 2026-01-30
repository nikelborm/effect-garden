import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as SortedMap from 'effect/SortedMap'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import * as ButtonState from '../branded/ButtonState.ts'
import * as MIDIValues from '../branded/MIDIValues.ts'
import { PhysicalButtonModel } from '../helpers/PhysicalButtonModel.ts'
import { sortedMapModifyAt } from '../helpers/sortedMapModifyAt.ts'
import { type Accord, AccordRegistry } from './AccordRegistry.ts'
import { type Pattern, PatternRegistry } from './PatternRegistry.ts'

const notesHandlingPatterns = EArray.range(92, 99)
const notesHandlingAccords = EArray.range(84, 91)

const makeMapEntry = (assignedTo: Accord | Pattern, note: number) =>
  [
    MIDIValues.NoteId(note),
    new PhysicalButtonModel(ButtonState.NotPressed, assignedTo),
  ] as const

export class PhysicalMIDIDeviceButtonModelToUIButtonMappingService extends Effect.Service<PhysicalMIDIDeviceButtonModelToUIButtonMappingService>()(
  'next-midi-demo/PhysicalMIDIDeviceButtonModelToUIButtonMappingService',
  {
    accessors: true,
    dependencies: [PatternRegistry.Default, AccordRegistry.Default],
    effect: Effect.gen(function* () {
      const allAccords = yield* AccordRegistry.allAccords
      const allPatterns = yield* PatternRegistry.allPatterns

      if (allPatterns.length !== notesHandlingPatterns.length)
        throw new Error(
          'Assertion failed: allPatterns.length !== notesHandlingPatterns.length',
        )

      if (allAccords.length !== notesHandlingAccords.length)
        throw new Error(
          'Assertion failed: allAccords.length !== notesHandlingAccords.length',
        )

      const modelToUIButtonMapRef =
        yield* SubscriptionRef.make<PhysicalMIDIDeviceButtonModelToUIButtonMap>(
          SortedMap.make(MIDIValues.NoteIdOrder)(
            ...EArray.zipWith(allPatterns, notesHandlingPatterns, makeMapEntry),
            ...EArray.zipWith(allAccords, notesHandlingAccords, makeMapEntry),
          ),
        )

      const currentMap = SubscriptionRef.get(modelToUIButtonMapRef)

      const getPhysicalMIDIDeviceButtonModelState = (
        noteId: MIDIValues.NoteId,
      ) =>
        Effect.map(
          currentMap,
          EFunction.flow(
            SortedMap.get(noteId),
            Option.getOrElse(
              () => new PhysicalButtonModel(ButtonState.NotPressed),
            ),
          ),
        )

      const setPhysicalMIDIDeviceButtonModelState = (
        noteId: MIDIValues.NoteId,
        pressState: ButtonState.Pressed | ButtonState.NotPressed,
      ) =>
        SubscriptionRef.update(
          modelToUIButtonMapRef,
          sortedMapModifyAt(noteId, midiButtonModelOption =>
            Option.some(
              new PhysicalButtonModel(
                pressState,
                midiButtonModelOption._tag === 'Some'
                  ? midiButtonModelOption.value?.assignedTo
                  : undefined,
              ),
            ),
          ),
        )

      // yield* reactivelySchedule(
      //   EFunction.pipe(
      //     yield* currentMap,
      //     SortedMap.keys,
      //     makeKeyboardSliceMapStream,
      //   ),
      //   setPhysicalMIDIDeviceButtonModelState,
      // )

      return {
        currentMap,
        mapChanges: modelToUIButtonMapRef.changes,
        getPhysicalMIDIDeviceButtonModelState,
      }
    }),
  },
) {}

export interface PhysicalMIDIDeviceButtonModelToUIButtonMap
  extends SortedMap.SortedMap<MIDIValues.NoteId, PhysicalButtonModel> {}
