import * as Atom from '@effect-atom/atom/Atom'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as SortedMap from 'effect/SortedMap'

import type { ButtonState, MIDIValues } from '../branded/index.ts'
import type { RegisteredButtonID } from '../branded/StoreValues.ts'
import { layoutAtom } from './Layout.ts'
import { assertiveGetButtonById } from './VirtualMIDIPadButtonsMap.ts'

export interface PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap
  extends SortedMap.SortedMap<MIDIValues.NoteId, AssignedMIDIDeviceNote> {}

export interface AssignedMIDIDeviceNote {
  assignedToVirtualMIDIPadButtonId?: RegisteredButtonID
  midiPadPress: ButtonState.NotPressed | ButtonState.Pressed
}

export const physicalMIDIDeviceStateAtom = Atom.writable(
  get => get(layoutAtom).physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap,
  (ctx, newMap: PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap) =>
    ctx.set(layoutAtom, {
      ...ctx.get(layoutAtom),
      physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap: newMap,
    }),
)

export const getVirtualMIDIPadButtonByPhysicalMIDIDeviceNote = Atom.family(
  (physicalMIDIDeviceNote: MIDIValues.NoteId) =>
    Atom.make(ctx =>
      EFunction.pipe(
        ctx.get(physicalMIDIDeviceStateAtom),
        SortedMap.get(physicalMIDIDeviceNote),
        Option.flatMap(assignedMIDIDeviceNote =>
          'assignedToVirtualMIDIPadButtonId' in assignedMIDIDeviceNote
            ? EFunction.pipe(
                assignedMIDIDeviceNote.assignedToVirtualMIDIPadButtonId,
                assertiveGetButtonById,
                ctx.get,
                Option.some,
              )
            : Option.none(),
        ),
      ),
    ),
)

export const setPhysicalButtonState = Atom.fnSync<{
  physicalMIDIDeviceNote: MIDIValues.NoteId
  midiPadPress: ButtonState.Pressed | ButtonState.NotPressed
}>()(({ physicalMIDIDeviceNote, midiPadPress }, ctx) => {
  const map = ctx(physicalMIDIDeviceStateAtom)
  EFunction.pipe(
    SortedMap.get(map, physicalMIDIDeviceNote),
    Option.match({
      onNone: () => ({ midiPadPress }),
      onSome: prev => ({ ...prev, midiPadPress }),
    }),
    val => SortedMap.set(map, physicalMIDIDeviceNote, val),
    newMap => ctx.set(physicalMIDIDeviceStateAtom, newMap),
  )
})
