import type * as SortedMap from 'effect/SortedMap'

import type { ButtonState } from '../branded/index.ts'
import type {
  RegisteredButtonID,
  ValidKeyboardKey,
} from '../branded/StoreValues.ts'

export interface KeyboardKeyToVirtualMIDIPadButtonMap
  extends SortedMap.SortedMap<ValidKeyboardKey, AssignedKeyboardKeyInfo> {}

export interface AssignedKeyboardKeyInfo {
  assignedToVirtualMIDIPadButtonId?: RegisteredButtonID
  keyboardKeyPressState: ButtonState.NotPressed | ButtonState.Pressed
}
