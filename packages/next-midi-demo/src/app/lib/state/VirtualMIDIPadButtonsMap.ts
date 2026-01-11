import * as Atom from '@effect-atom/atom/Atom'

import type { MIDIValues, StoreValues } from '../branded/index.ts'
import type { RegisteredButtonID } from '../branded/StoreValues.ts'
import { layoutAtom } from './Layout.ts'

export interface VirtualMIDIPadButtonsMap
  extends Map<RegisteredButtonID, VirtualMIDIPadButton> {}

export type VirtualMIDIPadButton =
  | {
      id: RegisteredButtonID
      label: string
      assignedMIDINote: MIDIValues.NoteId
    }
  | {
      id: RegisteredButtonID
      label: string
      patternId: number
    }

export const virtualMIDIPadButtonsStoreAtom = Atom.make(
  get => get(layoutAtom).virtualMIDIPadButtons,
)

export const assertiveGetButtonById = Atom.family(
  (buttonId: StoreValues.RegisteredButtonID) =>
    Atom.make(get => {
      const button = get(virtualMIDIPadButtonsStoreAtom).get(buttonId)

      if (!button)
        throw new Error(
          "Attempted to get button by id, that's not available in the button store",
        )

      return button
    }),
)

export const registeredButtonIdsAtom = Atom.make(get => [
  ...get(virtualMIDIPadButtonsStoreAtom).keys(),
])
