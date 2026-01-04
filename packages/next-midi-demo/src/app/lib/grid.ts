/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'
import { Atom, Result } from '@effect-atom/atom-react'
import { pipe } from 'effect/Function'
import * as Predicate from 'effect/Predicate'
import * as Stream from 'effect/Stream'
import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import * as Parsing from 'effect-web-midi/Parsing'
import * as Util from 'effect-web-midi/Util'

const makeStringLogAtom = Atom.family((inputId: EMIDIInput.Id | null) =>
  !inputId
    ? Atom.make(
        Result.success('Input id is not selected. No log entries to show'),
      )
    : pipe(
        EMIDIInput.makeMessagesStreamById(inputId),
        Parsing.withParsedDataField,
        Stream.filter(
          Predicate.or(Parsing.isChannelPressure, Parsing.isNotePress),
        ),
        Util.mapToGlidingStringLogOfLimitedEntriesCount(
          50,
          'latestFirst',
          current => ({
            time: current.capturedAt.toISOString(),
            id: current.cameFrom.id.slice(-10),
            ...current.midiMessage,
          }),
        ),
        Stream.provideLayer(
          EMIDIAccess.layerSystemExclusiveAndSoftwareSynthSupported,
        ),
        Stream.catchTag('MIDIAccessNotSupportedError', e =>
          Stream.succeed(e.cause.message),
        ),
        messageEventLogStream => Atom.make(messageEventLogStream),
        Atom.keepAlive,
        Atom.withServerValueInitial,
      ),
)

export type ButtonState = {
  noteIndex: number
  columnIndex: number
  rowIndex: number
  activationReportedByDevice: number
  // isPressedByMouse: boolean
}

export const layoutStoreAtom = Atom.make<
  Record<
    string,
    {
      inputIdPreferences: EMIDIInput.Id[]
      width: number
      height: number
      buttonStates: ButtonState[][]
    }
  >
>({
  main: {
    width: 8,
    height: 8,
    inputIdPreferences: [
      EMIDIInput.Id(
        'EFE87192AEC369B27A01D61D0727D8ADF620A34131385F60C48E155102A544E4',
      ),
    ],
    buttonStates: Array.from({ length: 8 }, (_, rowIndex) =>
      Array.from({ length: 8 }, (_, columnIndex) => ({
        columnIndex,
        rowIndex,
        noteIndex: rowIndex * 8 + columnIndex,
        activationReportedByDevice: 0,
        // isPressedByMouse: Math.random() > 0.5,
      })),
    ),
  },
})

export const selectedLayoutIdAtom = Atom.make('main' as string | null)

export const currentLayoutAtom = Atom.make(get => {
  const id = get(selectedLayoutIdAtom)
  return id ? (get(layoutStoreAtom)[id] ?? null) : null
})

export const getRowOfCurrentLayoutAtom = Atom.family((rowIndex: number) =>
  Atom.make(get => get(currentLayoutAtom)?.buttonStates?.[rowIndex] ?? null),
)

export const getCellOfCurrentLayoutAtom = Atom.family(
  ({ columnIndex, rowIndex }: { rowIndex: number; columnIndex: number }) =>
    Atom.make(
      get => get(getRowOfCurrentLayoutAtom(rowIndex))?.[columnIndex] ?? null,
    ),
)

export const currentLayoutWidthAtom = Atom.make(get => {
  const layout = get(currentLayoutAtom)
  return layout ? layout.width : null
})

export const currentLayoutHeightAtom = Atom.make(get => {
  const layout = get(currentLayoutAtom)
  return layout ? layout.height : null
})
