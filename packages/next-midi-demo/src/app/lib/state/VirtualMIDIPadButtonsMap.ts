import * as Atom from '@effect-atom/atom/Atom'
import * as EArray from 'effect/Array'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as SortedMap from 'effect/SortedMap'

import type { MIDIValues, StoreValues } from '../branded/index.ts'
import type { RegisteredButtonID } from '../branded/StoreValues.ts'
import { layoutAtom } from './Layout.ts'

export interface VirtualMIDIPadButtonsMap
  extends SortedMap.SortedMap<RegisteredButtonID, VirtualMIDIPadButton> {}

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
    Atom.make(get =>
      EFunction.pipe(
        virtualMIDIPadButtonsStoreAtom,
        get,
        SortedMap.get(buttonId),
        Option.getOrThrowWith(
          () =>
            new Error(
              "Attempted to get button by id, that's not available in the button store",
            ),
        ),
      ),
    ),
)

export const registeredButtonIdsAtom = Atom.make(get =>
  EFunction.pipe(
    virtualMIDIPadButtonsStoreAtom,
    get,
    SortedMap.keys,
    EArray.fromIterable,
  ),
)
