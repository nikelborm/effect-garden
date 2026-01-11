import * as EMIDIInput from 'effect-web-midi/EMIDIInput'

import * as Atom from '@effect-atom/atom/Atom'
import * as SortedMap from 'effect/SortedMap'
import type * as Types from 'effect/Types'

import { ButtonState, MIDIValues } from '../branded/index.ts'
import * as StoreValues from '../branded/StoreValues.ts'
import type { KeyboardKeyToVirtualMIDIPadButtonMap } from './KeyboardKeyToVirtualMIDIPadButtonMap.ts'
import type { PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap } from './PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap.ts'
import type { VirtualMIDIPadButtonsMap } from './VirtualMIDIPadButtonsMap.ts'

const height = 2
const width = 8

const keyboardLayout = [
  /////////
  '12345678',
  'qwertyui',
  /////////
] as Types.TupleOf<2, string>

const midiLayout = [
  [92, 93, 94, 95, 96, 97, 98, 99],
  [84, 85, 86, 87, 88, 89, 90, 91],
] as const

const buttonLayout = [
  [
    { patternId: 1, label: 'P1' },
    { patternId: 2, label: 'P2' },
    { patternId: 3, label: 'P3' },
    { patternId: 4, label: 'P4' },
    { patternId: 5, label: 'P5' },
    { patternId: 6, label: 'P6' },
    { patternId: 7, label: 'P7' },
    { patternId: 8, label: 'P8' },
  ],
  [
    { noteId: 24, label: 'C' },
    { noteId: 25, label: 'Dm' },
    { noteId: 27, label: 'Em' },
    { noteId: 29, label: 'F' },
    { noteId: 31, label: 'G' },
    { noteId: 32, label: 'Am' },
    { noteId: 26, label: 'D' },
    { noteId: 28, label: 'E' },
  ],
] as const

export const layoutAtom = Atom.make<Layout>({
  width,
  height,

  inputIdPreferences: [
    EMIDIInput.Id(
      'EFE87192AEC369B27A01D61D0727D8ADF620A34131385F60C48E155102A544E4',
    ),
  ],
  keyboardKeyToVirtualMIDIPadButtonMap: SortedMap.make(
    StoreValues.ValidKeyboardKeyOrder,
  )(
    ...[...keyboardLayout[0]].map(
      (key, index) =>
        [
          StoreValues.ValidKeyboardKey(key),
          {
            assignedToVirtualMIDIPadButtonId: StoreValues.RegisteredButtonID(
              `pattern-button-id-${index + 1}`,
            ),
            keyboardKeyPressState: ButtonState.NotPressed,
          },
        ] as const,
    ),
    ...[...keyboardLayout[1]].map(
      (key, index) =>
        [
          StoreValues.ValidKeyboardKey(key),
          {
            assignedToVirtualMIDIPadButtonId: StoreValues.RegisteredButtonID(
              `accord-button-id-${index + 1}`,
            ),
            keyboardKeyPressState: ButtonState.NotPressed,
          },
        ] as const,
    ),
  ),

  physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap: SortedMap.make(
    MIDIValues.NoteIdOrder,
  )(
    ...[...midiLayout[0]].map(
      (MIDINote, index) =>
        [
          MIDIValues.NoteId(MIDINote),
          {
            assignedToVirtualMIDIPadButtonId: StoreValues.RegisteredButtonID(
              `pattern-button-id-${index + 1}`,
            ),
            midiPadPress: ButtonState.NotPressed,
          },
        ] as const,
    ),
    ...[...midiLayout[1]].map(
      (MIDINote, index) =>
        [
          MIDIValues.NoteId(MIDINote),
          {
            assignedToVirtualMIDIPadButtonId: StoreValues.RegisteredButtonID(
              `accord-button-id-${index + 1}`,
            ),
            midiPadPress: ButtonState.NotPressed,
          },
        ] as const,
    ),
  ),

  virtualMIDIPadButtons: SortedMap.make(StoreValues.RegisteredButtonIdOrder)(
    ...[...buttonLayout[0]].map(({ label, patternId }, index) => {
      const id = StoreValues.RegisteredButtonID(
        `pattern-button-id-${index + 1}`,
      )
      return [id, { id, label, patternId }] as const
    }),
    ...[...buttonLayout[1]].map(({ label, noteId }, index) => {
      const id = StoreValues.RegisteredButtonID(`accord-button-id-${index + 1}`)
      return [
        id,
        { id, label, assignedMIDINote: MIDIValues.NoteId(noteId) },
      ] as const
    }),
  ),
}).pipe(Atom.withLabel('layout'))

export interface Layout {
  inputIdPreferences: EMIDIInput.Id[]
  width: number
  height: number
  keyboardKeyToVirtualMIDIPadButtonMap: KeyboardKeyToVirtualMIDIPadButtonMap
  physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap: PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap
  virtualMIDIPadButtons: VirtualMIDIPadButtonsMap
}

export const layoutWidthAtom = Atom.make(get => get(layoutAtom).width).pipe(
  Atom.withLabel('layoutWidth'),
)

export const layoutHeightAtom = Atom.make(get => get(layoutAtom).height).pipe(
  Atom.withLabel('layoutHeight'),
)
