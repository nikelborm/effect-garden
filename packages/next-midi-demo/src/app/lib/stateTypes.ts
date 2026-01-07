import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'

import type {
  LayoutId,
  MIDINoteId,
  NoteCurrentPressure,
  NoteInitialVelocity,
  NotPressed,
  Pressed,
  PressedContinuously,
  RegisteredButtonID,
  ValidKeyboardKey,
} from './branded.ts'
export interface LayoutMap extends Map<LayoutId, Layout> {}

export interface Layout {
  id: LayoutId
  inputIdPreferences: EMIDIInput.Id[]
  width: number
  height: number
  keyboardKeyToVirtualMIDIPadButtonMap: KeyboardKeyToVirtualMIDIPadButtonMap
  physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap: PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap
  virtualMIDIPadButtons: VirtualMIDIPadButtonsMap
}

export interface KeyboardKeyToVirtualMIDIPadButtonMap
  extends Map<ValidKeyboardKey, AssignedKeyboardKeyInfo> {}

export interface PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap
  extends Map<MIDINoteId, AssignedMIDIDeviceNote> {}

export interface VirtualMIDIPadButtonsMap
  extends Map<RegisteredButtonID, VirtualMIDIPadButton> {}

interface AssignedMIDIDeviceNote {
  assignedToVirtualMIDIPadButtonId?: RegisteredButtonID
  midiPadPress: MIDIDeviceNotePressInfo
}

export type MIDIDeviceNotePressInfo =
  | { state: NotPressed }
  | { state: Pressed; initialAcquiredVelocity: NoteInitialVelocity }
  | {
      state: PressedContinuously
      initialAcquiredVelocity: NoteInitialVelocity
      latestContinuousPressure: NoteCurrentPressure
    }

export interface VirtualMIDIPadButton {
  id: RegisteredButtonID
  assignedMIDINote: MIDINoteId
  assignedSound: unknown
}

export interface AssignedKeyboardKeyInfo {
  assignedToVirtualMIDIPadButtonId?: RegisteredButtonID
  keyboardKeyPressState: NotPressed | Pressed
}
