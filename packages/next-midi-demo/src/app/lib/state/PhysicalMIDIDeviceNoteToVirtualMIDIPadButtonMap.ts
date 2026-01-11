import type * as SortedMap from 'effect/SortedMap'

import type { ButtonState, MIDIValues } from '../branded/index.ts'
import type { RegisteredButtonID } from '../branded/StoreValues.ts'

export interface PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap
  extends SortedMap.SortedMap<MIDIValues.NoteId, AssignedMIDIDeviceNote> {}

export interface AssignedMIDIDeviceNote {
  assignedToVirtualMIDIPadButtonId?: RegisteredButtonID
  midiPadPress: ButtonState.NotPressed | ButtonState.Pressed
}
