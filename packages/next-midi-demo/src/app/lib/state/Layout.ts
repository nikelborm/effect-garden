import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'

import * as Atom from '@effect-atom/atom/Atom'
import { pipe } from 'effect/Function'
import * as Option from 'effect/Option'

import type * as StoreValues from '../branded/StoreValues.ts'
import type { KeyboardKeyToVirtualMIDIPadButtonMap } from './KeyboardKeyToVirtualMIDIPadButtonMap.ts'
import { layoutMapAtom } from './LayoutMap.ts'
import type { PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap } from './PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap.ts'
import type { VirtualMIDIPadButtonsMap } from './VirtualMIDIPadButtonsMap.ts'

export interface Layout {
  id: StoreValues.LayoutId
  inputIdPreferences: EMIDIInput.Id[]
  width: number
  height: number
  keyboardKeyToVirtualMIDIPadButtonMap: KeyboardKeyToVirtualMIDIPadButtonMap
  physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap: PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap
  virtualMIDIPadButtons: VirtualMIDIPadButtonsMap
}

export const assertiveGetLayoutAtomByLayoutId = Atom.family(
  (id: StoreValues.LayoutId) =>
    Atom.make(get => {
      const layout = get(layoutMapAtom).get(id)

      if (!layout)
        throw new Error(
          "Attempted to get layout by id, that's not available in the layout store",
        )

      return layout
    }),
)

/**
 * using null deselects it
 */
export const activeLayoutAtom = Atom.writable<
  Option.Option<Layout>,
  StoreValues.LayoutId | null
>(
  get =>
    Option.some(
      get(assertiveGetLayoutAtomByLayoutId('main' as StoreValues.LayoutId)),
    ),
  (ctx, activeLayoutId) => {
    if (!activeLayoutId) return ctx.setSelf(Option.none())

    ctx.set(focusedCellOfActiveLayoutAtom, Atom.Reset)
    pipe(
      activeLayoutId,
      assertiveGetLayoutAtomByLayoutId,
      ctx.get,
      Option.some,
      ctx.setSelf,
    )
  },
).pipe(Atom.withLabel('activeLayoutId'))

export const activeLayoutWidthAtom = Atom.make(get =>
  Option.map(get(activeLayoutAtom), _ => _.width),
).pipe(Atom.withLabel('activeLayoutWidth'))

export const activeLayoutHeightAtom = Atom.make(get =>
  Option.map(get(activeLayoutAtom), _ => _.height),
).pipe(Atom.withLabel('activeLayoutHeight'))
