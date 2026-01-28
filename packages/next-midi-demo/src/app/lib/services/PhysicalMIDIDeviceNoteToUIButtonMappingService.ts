import * as EArray from 'effect/Array'
import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as SortedMap from 'effect/SortedMap'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import * as ButtonState from '../branded/ButtonState.ts'
import * as MIDIValues from '../branded/MIDIValues.ts'
import type * as StoreValues from '../branded/StoreValues.ts'
import { UIButtonService } from './UIButtonService.ts'

const midiLayout = {
  notesHandlingPatterns: EArray.range(92, 99),
  notesHandlingAccords: EArray.range(84, 91),
}

export class PhysicalMIDIDeviceNoteToUIButtonMappingService extends Effect.Service<PhysicalMIDIDeviceNoteToUIButtonMappingService>()(
  'next-midi-demo/PhysicalMIDIDeviceNoteToUIButtonMappingService',
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const buttonService = yield* UIButtonService
      const patternButtonIds = yield* buttonService.patternButtonIds
      const accordButtonIds = yield* buttonService.accordButtonIds

      if (patternButtonIds.length !== midiLayout.notesHandlingPatterns.length)
        throw new Error(
          'Assertion failed: patternButtonIds.length !== midiLayout.notesHandlingPatterns.length',
        )

      if (accordButtonIds.length !== midiLayout.notesHandlingAccords.length)
        throw new Error(
          'Assertion failed: accordButtonIds.length !== midiLayout.notesHandlingAccords.length',
        )

      const makeMapEntry = (
        registeredButtonId: StoreValues.RegisteredButtonID,
        note: number,
      ) =>
        [
          MIDIValues.NoteId(note),
          new AssignedPhysicalMIDIDeviceNote(
            ButtonState.NotPressed,
            registeredButtonId,
          ),
        ] as const

      const physicalToVirtualKeyMapRef =
        yield* SubscriptionRef.make<PhysicalMIDIDeviceNoteToUIButtonMap>(
          SortedMap.make(MIDIValues.NoteIdOrder)(
            ...EArray.zipWith(
              patternButtonIds,
              midiLayout.notesHandlingPatterns,
              makeMapEntry,
            ),
            ...EArray.zipWith(
              accordButtonIds,
              midiLayout.notesHandlingAccords,
              makeMapEntry,
            ),
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
  assignedToUIButtonId?: StoreValues.RegisteredButtonID
  keyboardKeyPressState: ButtonState.NotPressed | ButtonState.Pressed
}> {
  constructor(
    keyboardKeyPressState: ButtonState.NotPressed | ButtonState.Pressed,
    assignedToUIButtonId?: StoreValues.RegisteredButtonID,
  ) {
    super({
      keyboardKeyPressState,
      ...(assignedToUIButtonId && { assignedToUIButtonId }),
    })
  }

  static setState = (
    info: AssignedPhysicalMIDIDeviceNote,
    state: ButtonState.NotPressed | ButtonState.Pressed,
  ) => new AssignedPhysicalMIDIDeviceNote(state, info.assignedToUIButtonId)
}
