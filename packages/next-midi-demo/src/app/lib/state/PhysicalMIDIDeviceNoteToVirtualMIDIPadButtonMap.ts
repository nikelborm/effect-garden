import type { ButtonState, MIDIValues } from '../branded/index.ts'
import type { RegisteredButtonID } from '../branded/StoreValues.ts'

export interface PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap
  extends Map<MIDIValues.NoteId, AssignedMIDIDeviceNote> {}

export interface AssignedMIDIDeviceNote {
  assignedToVirtualMIDIPadButtonId?: RegisteredButtonID
  midiPadPress: MIDIDeviceNotePressInfo
}

export type MIDIDeviceNotePressInfo =
  | { state: ButtonState.NotPressed }
  | {
      state: ButtonState.Pressed
      initialAcquiredVelocity: MIDIValues.NoteInitialVelocity
    }
  | {
      state: ButtonState.PressedContinuously
      initialAcquiredVelocity: MIDIValues.NoteInitialVelocity
      latestContinuousPressure: MIDIValues.NoteCurrentPressure
    }
