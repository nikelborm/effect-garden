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

// |--------------------------|
// | 1 - MIDI note            |
// | 2 - Octave               |
// | 3 - # note name          |
// | 4 - b note name          |
// | 5 - m (minor) note name  |
// | 6 - present in files     |
// |--------------------------|
// | 1   2   3    4    5   6  |
// |--------------------------|
// | 24  1   C    C    C   +  |
// | 25  1   C#   Db   Dm  +  |
// | 26  1   D    D    D   +  |
// | 27  1   D#   Eb   Em  +  |
// | 28  1   E    E    E   +  |
// | 29  1   F    F    F   +  |
// | 30  1   F#   Gb   Gm     |
// | 31  1   G    G    G   +  |
// | 32  1   G#   Ab   Am  +  |
// | 33  1   A    A    A      |
// | 34  1   A#   Bb   Bm     |
// | 35  1   B    B    B      |
// |--------------------------|
// | Aggregate counts:        |
// |--------------------------|
// |         2C   1C       1C |
// |         2D   2D       2D |
// |         1E   2E       2E |
// |         2F   1F       1F |
// |         2G   2G       1G |
// |         2A   2A       1A |
// |         1B   2B       0B |
// |--------------------------|

export interface KeyboardKeyToVirtualMIDIPadButtonMap
  extends Map<ValidKeyboardKey, AssignedKeyboardKeyInfo> {}

export interface PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap
  extends Map<MIDINoteId, AssignedMIDIDeviceNote> {}

export interface VirtualMIDIPadButtonsMap
  extends Map<RegisteredButtonID, VirtualMIDIPadButton> {}

export interface AssignedMIDIDeviceNote {
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
