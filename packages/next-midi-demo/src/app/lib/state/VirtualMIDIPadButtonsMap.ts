import * as Atom from '@effect-atom/atom/Atom'
import * as EArray from 'effect/Array'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as SortedMap from 'effect/SortedMap'

import type { MIDIValues, StoreValues } from '../branded/index.ts'
import type { RegisteredButtonID } from '../branded/StoreValues.ts'
import { layoutAtom } from './Layout.ts'

export interface VirtualMIDIPadButtonsMap
  extends SortedMap.SortedMap<RegisteredButtonID, VirtualMIDIPadButton> {}

export type VirtualMIDIPadButton =
  | {
      id: RegisteredButtonID
      order: number
      label: string
      assignedMIDINote: MIDIValues.NoteId
    }
  | {
      id: RegisteredButtonID
      order: number
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

export const sortedRegisteredButtonIdsAtom = Atom.make(get =>
  EFunction.pipe(
    virtualMIDIPadButtonsStoreAtom,
    get,
    SortedMap.entries,
    EArray.fromIterable,
    EArray.sortWith(([, button]) => button.order, Order.number),
    EArray.map(([id]) => id),
  ),
)
