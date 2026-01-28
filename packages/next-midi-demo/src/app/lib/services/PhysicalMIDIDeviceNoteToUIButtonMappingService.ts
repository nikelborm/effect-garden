import * as EArray from 'effect/Array'
import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as SortedMap from 'effect/SortedMap'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import * as ButtonState from '../branded/ButtonState.ts'
import * as MIDIValues from '../branded/MIDIValues.ts'
import { type Accord, AccordRegistry } from './AccordRegistry.ts'
import { type Pattern, PatternRegistry } from './PatternRegistry.ts'

const notesHandlingPatterns = EArray.range(92, 99)
const notesHandlingAccords = EArray.range(84, 91)

const makeMapEntry = (assignedTo: Accord | Pattern, note: number) =>
  [
    MIDIValues.NoteId(note),
    new AssignedPhysicalMIDIDeviceNote(ButtonState.NotPressed, assignedTo),
  ] as const

export class PhysicalMIDIDeviceNoteToUIButtonMappingService extends Effect.Service<PhysicalMIDIDeviceNoteToUIButtonMappingService>()(
  'next-midi-demo/PhysicalMIDIDeviceNoteToUIButtonMappingService',
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

      const physicalToVirtualKeyMapRef =
        yield* SubscriptionRef.make<PhysicalMIDIDeviceNoteToUIButtonMap>(
          SortedMap.make(MIDIValues.NoteIdOrder)(
            ...EArray.zipWith(allPatterns, notesHandlingPatterns, makeMapEntry),
            ...EArray.zipWith(allAccords, notesHandlingAccords, makeMapEntry),
          ),
        )

      const currentMap = SubscriptionRef.get(physicalToVirtualKeyMapRef)

      const getPhysicalMIDIDeviceNoteStateFromMap = (
        noteId: MIDIValues.NoteId,
      ) =>
        EFunction.flow(
          SortedMap.get(noteId)<AssignedPhysicalMIDIDeviceNote>,
          Option.getOrElse(
            () => new AssignedPhysicalMIDIDeviceNote(ButtonState.NotPressed),
          ),
        )

      const getPhysicalMIDIDeviceNoteState = (noteId: MIDIValues.NoteId) =>
        Effect.map(currentMap, getPhysicalMIDIDeviceNoteStateFromMap(noteId))

      const setPhysicalMIDIDeviceNoteState = (
        noteId: MIDIValues.NoteId,
        padPressState: ButtonState.Pressed | ButtonState.NotPressed,
      ) =>
        SubscriptionRef.update(physicalToVirtualKeyMapRef, prevMap =>
          SortedMap.set(
            prevMap,
            noteId,
            AssignedPhysicalMIDIDeviceNote.setState(
              getPhysicalMIDIDeviceNoteStateFromMap(noteId)(prevMap),
              padPressState,
            ),
          ),
        )

      return {
        currentMap,
        mapChanges: physicalToVirtualKeyMapRef.changes,
        setPhysicalMIDIDeviceNoteState,
        getPhysicalMIDIDeviceNoteState,
      }
    }),
  },
) {}

export interface PhysicalMIDIDeviceNoteToUIButtonMap
  extends SortedMap.SortedMap<
    MIDIValues.NoteId,
    AssignedPhysicalMIDIDeviceNote
  > {}

export class AssignedPhysicalMIDIDeviceNote extends Data.Class<{
  keyboardKeyPressState: ButtonState.NotPressed | ButtonState.Pressed
  assignedTo?: Accord | Pattern
}> {
  constructor(
    keyboardKeyPressState: ButtonState.NotPressed | ButtonState.Pressed,
    assignedTo?: Accord | Pattern,
  ) {
    super({ keyboardKeyPressState, ...(assignedTo && { assignedTo }) })
  }

  static setState = (
    info: AssignedPhysicalMIDIDeviceNote,
    state: ButtonState.NotPressed | ButtonState.Pressed,
  ) => new AssignedPhysicalMIDIDeviceNote(state, info.assignedTo)
}
