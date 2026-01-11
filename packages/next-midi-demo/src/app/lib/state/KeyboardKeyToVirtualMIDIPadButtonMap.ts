import type { ButtonState } from '../branded/index.ts'
import type {
  RegisteredButtonID,
  ValidKeyboardKey,
} from '../branded/StoreValues.ts'

export interface KeyboardKeyToVirtualMIDIPadButtonMap
  extends Map<ValidKeyboardKey, AssignedKeyboardKeyInfo> {}

export interface AssignedKeyboardKeyInfo {
  assignedToVirtualMIDIPadButtonId?: RegisteredButtonID
  keyboardKeyPressState: ButtonState.NotPressed | ButtonState.Pressed
}
