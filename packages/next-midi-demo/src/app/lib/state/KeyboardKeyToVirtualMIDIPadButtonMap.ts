import * as Atom from '@effect-atom/atom/Atom'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as SortedMap from 'effect/SortedMap'

import type { ButtonState } from '../branded/index.ts'
import type {
  RegisteredButtonID,
  ValidKeyboardKey,
} from '../branded/StoreValues.ts'
import { layoutAtom } from './Layout.ts'

export interface KeyboardKeyToVirtualMIDIPadButtonMap
  extends SortedMap.SortedMap<ValidKeyboardKey, AssignedKeyboardKeyInfo> {}

export interface AssignedKeyboardKeyInfo {
  assignedToVirtualMIDIPadButtonId?: RegisteredButtonID
  keyboardKeyPressState: ButtonState.NotPressed | ButtonState.Pressed
}

export const assignedKeyboardKeyStoreAtom = Atom.writable(
  get => get(layoutAtom).keyboardKeyToVirtualMIDIPadButtonMap,
  (ctx, newMap: KeyboardKeyToVirtualMIDIPadButtonMap) =>
    ctx.set(layoutAtom, {
      ...ctx.get(layoutAtom),
      keyboardKeyToVirtualMIDIPadButtonMap: newMap,
    }),
)

export const setKeyboardKeyState = Atom.fnSync<{
  key: ValidKeyboardKey
  keyboardKeyPressState: ButtonState.Pressed | ButtonState.NotPressed
}>()(({ key, keyboardKeyPressState }, ctx) => {
  const map = ctx(assignedKeyboardKeyStoreAtom)
  EFunction.pipe(
    SortedMap.get(map, key),
    Option.match({
      onNone: () => ({ keyboardKeyPressState }),
      onSome: prev => ({ ...prev, keyboardKeyPressState }),
    }),
    val => SortedMap.set(map, key, val),
    newMap => ctx.set(assignedKeyboardKeyStoreAtom, newMap),
  )
})
