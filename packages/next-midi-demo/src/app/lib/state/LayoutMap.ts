import * as EMIDIInput from 'effect-web-midi/EMIDIInput'

import * as Atom from '@effect-atom/atom/Atom'

import { ButtonState, MIDIValues } from '../branded/index.ts'
import * as StoreValues from '../branded/StoreValues.ts'
import type { AssignedKeyboardKeyInfo } from './KeyboardKeyToVirtualMIDIPadButtonMap.ts'
import type { Layout } from './Layout.ts'
import type { VirtualMIDIPadButton } from './VirtualMIDIPadButtonsMap.ts'

export interface LayoutMap extends Map<StoreValues.LayoutId, Layout> {}

const width = 8
const height = 8

const keyboardLayout = [
  /////////
  '123456',
  'qwerty',
  'asdfgh',
  'zxcvbn',
  /////////
]

const mainLayoutId = 'main' as StoreValues.LayoutId

export const layoutMapAtom = Atom.make<LayoutMap>(
  new Map([
    [
      mainLayoutId,
      {
        id: mainLayoutId,
        width,
        height,

        inputIdPreferences: [
          EMIDIInput.Id(
            'EFE87192AEC369B27A01D61D0727D8ADF620A34131385F60C48E155102A544E4',
          ),
        ],
        keyboardKeyToVirtualMIDIPadButtonMap: new Map(
          keyboardLayout.flatMap((row, rowIndex) => {
            const currentRowEntries: [
              StoreValues.ValidKeyboardKey,
              AssignedKeyboardKeyInfo,
            ][] = []

            for (const key of row) {
              const columnIndex = currentRowEntries.length
              const buttonIndex = rowIndex * width + columnIndex

              currentRowEntries.push([
                StoreValues.ValidKeyboardKey(key),
                {
                  assignedToVirtualMIDIPadButtonId:
                    StoreValues.RegisteredButtonID(
                      `registered-button-id-${buttonIndex}`,
                    ),
                  keyboardKeyPressState: ButtonState.NotPressed,
                },
              ])
            }

            return currentRowEntries
          }),
        ),

        physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap: new Map(
          Array.from({ length: width * height }, (_, buttonIndex) => [
            MIDIValues.NoteId(buttonIndex),
            {
              assignedToVirtualMIDIPadButtonId: StoreValues.RegisteredButtonID(
                `registered-button-id-${buttonIndex}`,
              ),
              midiPadPress: { state: ButtonState.NotPressed },
            },
          ]),
        ),

        virtualMIDIPadButtons: new Map(
          Array.from(
            { length: width * height },
            (_, buttonIndex) =>
              [
                StoreValues.RegisteredButtonID(
                  `registered-button-id-${buttonIndex}`,
                ),
                {
                  id: StoreValues.RegisteredButtonID(
                    `registered-button-id-${buttonIndex}`,
                  ),
                  assignedMIDINote: MIDIValues.NoteId(buttonIndex),
                  assignedSound: Buffer.from([]),
                },
              ] satisfies [
                StoreValues.RegisteredButtonID,
                VirtualMIDIPadButton,
              ],
          ),
        ),
      },
    ],
  ]),
).pipe(Atom.withLabel('layoutMap'))
