import * as Atom from '@effect-atom/atom/Atom'
import { pipe } from 'effect/Function'
import * as Option from 'effect/Option'

import type { MIDIValues, StoreValues } from '../branded/index.ts'
import type { RegisteredButtonID } from '../branded/StoreValues.ts'
import {
  activeLayoutAtom,
  assertiveGetLayoutAtomByLayoutId,
  type Layout,
} from './Layout.ts'

export interface VirtualMIDIPadButtonsMap
  extends Map<RegisteredButtonID, VirtualMIDIPadButton> {}

export interface VirtualMIDIPadButton {
  id: RegisteredButtonID
  assignedMIDINote: MIDIValues.NoteId
  assignedSound: unknown
}

const getVirtualMIDIPadButtonsStoreByLayout = (layout: Layout) =>
  layout.virtualMIDIPadButtons

export const assertiveGetButtonStoreByLayoutId = Atom.family(
  (layoutId: StoreValues.LayoutId) =>
    Atom.make(getAtomValue =>
      pipe(
        layoutId,
        assertiveGetLayoutAtomByLayoutId,
        getAtomValue,
        getVirtualMIDIPadButtonsStoreByLayout,
      ),
    ),
)

export const activeLayoutVirtualMIDIPadButtonsStoreAtom = Atom.make(get =>
  Option.map(get(activeLayoutAtom), getVirtualMIDIPadButtonsStoreByLayout),
)

const assertiveGetButtonByIdAndButtonStore = (
  buttonId: StoreValues.RegisteredButtonID,
  buttonStore: VirtualMIDIPadButtonsMap,
) => {
  const button = buttonStore.get(buttonId)

  if (!button)
    throw new Error(
      "Attempted to get button by id, that's not available in the button store",
    )

  return button
}

export const assertiveGetButtonByIdAndLayoutId = Atom.family(
  ([buttonId, layoutId]: StoreValues.ButtonAddress) =>
    Atom.make(get =>
      assertiveGetButtonByIdAndButtonStore(
        buttonId,
        get(assertiveGetButtonStoreByLayoutId(layoutId)),
      ),
    ),
)

export const assertiveGetButtonOfActiveLayoutById = Atom.family(
  (buttonId: StoreValues.RegisteredButtonID) =>
    Atom.make(get =>
      Option.map(get(activeLayoutVirtualMIDIPadButtonsStoreAtom), buttons =>
        assertiveGetButtonByIdAndButtonStore(buttonId, buttons),
      ),
    ),
)

export const registeredButtonIdsOfActiveLayoutAtom = Atom.make(get =>
  Option.map(get(activeLayoutVirtualMIDIPadButtonsStoreAtom), buttons => [
    ...buttons.keys(),
  ]),
)
