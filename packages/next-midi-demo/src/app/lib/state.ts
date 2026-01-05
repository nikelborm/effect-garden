'use client'
import { Atom, Result } from '@effect-atom/atom-react'
import * as EArray from 'effect/Array'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import { pipe } from 'effect/Function'
import * as Predicate from 'effect/Predicate'
import * as Record from 'effect/Record'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'
import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import type * as EMIDIPort from 'effect-web-midi/EMIDIPort'
import type * as MIDIErrors from 'effect-web-midi/MIDIErrors'
import * as Parsing from 'effect-web-midi/Parsing'
import * as Util from 'effect-web-midi/Util'
import * as Key from 'ts-key-not-enum'

export const getMessagesLogAtom = Atom.family(
  (inputId: EMIDIInput.Id | null) =>
    !inputId
      ? Atom.make(
          Result.success('Input id is not selected. No log entries to show'),
        ).pipe(Atom.withLabel('messagesLog'))
      : pipe(
          EMIDIInput.makeMessagesStreamById(inputId),
          Parsing.withParsedDataField,
          Parsing.withTouchpadPositionUpdates,
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
          Atom.withLabel('messagesLog'),
          Atom.keepAlive,
          Atom.withServerValueInitial,
        ),
)

export interface ButtonState extends ButtonCoordinates {
  noteIndex: number
  activationReportedByDevice: number
  // isPressedByMouse: boolean
}

export interface ButtonCoordinates {
  rowIndex: number
  columnIndex: number
}

export interface Layout {
  inputIdPreferences: EMIDIInput.Id[]
  width: number
  height: number
  buttonStates: ButtonState[][]
}

export const layoutStoreAtom = Atom.make<Record<string, Layout>>({
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
}).pipe(Atom.withLabel('layoutStore'))

export const selectedLayoutIdAtom = Atom.make<string | null>('main').pipe(
  Atom.withLabel('selectedLayoutId'),
)

export const currentLayoutAtom = Atom.make(get => {
  const id = get(selectedLayoutIdAtom)
  return id ? (get(layoutStoreAtom)[id] ?? null) : null
}).pipe(Atom.withLabel('currentLayout'))

export const getRowOfCurrentLayoutAtom = Atom.family((rowIndex: number) =>
  Atom.make(
    get => get(currentLayoutAtom)?.buttonStates?.[rowIndex] ?? null,
  ).pipe(Atom.withLabel('rowOfCurrentLayout')),
)

export const getCellOfCurrentLayoutAtom = Atom.family(
  ({ columnIndex, rowIndex }: { rowIndex: number; columnIndex: number }) =>
    Atom.make(
      get => get(getRowOfCurrentLayoutAtom(rowIndex))?.[columnIndex] ?? null,
    ).pipe(Atom.withLabel('cellOfCurrentLayout')),
)

export const currentFocusedCellCoordinatesAtom =
  Atom.make<ButtonCoordinates | null>(null).pipe(
    Atom.withLabel('currentFocusedCellCoordinates'),
  )

export const currentFocusedCellAtom = Atom.writable(
  get => {
    const coordinates = get(currentFocusedCellCoordinatesAtom)
    return coordinates && get(getCellOfCurrentLayoutAtom(coordinates))
  },
  (ctx, value: ButtonCoordinates | null) =>
    ctx.set(currentFocusedCellCoordinatesAtom, value),
).pipe(Atom.withLabel('currentFocusedCell'))

export const currentLayoutWidthAtom = Atom.make(get => {
  const layout = get(currentLayoutAtom)
  return layout ? layout.width : null
}).pipe(Atom.withLabel('currentLayoutWidth'))

export const currentLayoutHeightAtom = Atom.make(get => {
  const layout = get(currentLayoutAtom)
  return layout ? layout.height : null
}).pipe(Atom.withLabel('currentLayoutHeight'))

//
// port maps
//

interface UpdatePortMapFn {
  /**
   *
   */
  (portMap: EMIDIPort.IdToInstanceMap): EMIDIPort.IdToInstanceMap
}

export const keyDownEventsStream = Stream.fromEventListener<KeyboardEvent>(
  document,
  'keydown',
  {
    bufferSize: 0,
  },
).pipe(Stream.map(e => e.key))

document.addEventListener('keydown', event => {
  switch (event.key) {
    case 'ArrowLeft':
      // Your code for Left Arrow
      console.log('Left arrow pressed')
      break
    case 'ArrowRight':
      // Your code for Right Arrow
      console.log('Right arrow pressed')
      break
  }
})

export const portMapAtom = Effect.gen(function* () {
  const initialValue = yield* EMIDIAccess.AllPortsRecord
  const portsMapRef = yield* Ref.make(initialValue)

  return Stream.concat(
    Stream.succeed(initialValue),
    Stream.mapEffect(
      EMIDIAccess.makeAllPortsStateChangesStreamInContext(),
      ({ port, newState }) =>
        Ref.updateAndGet(
          portsMapRef,
          (newState.ofDevice === 'disconnected'
            ? Record.remove(port.id)
            : Record.set(port.id, port)) as UpdatePortMapFn,
        ),
    ),
  )
}).pipe(
  Stream.unwrap,
  Stream.provideLayer(EMIDIAccess.layerSoftwareSynthSupported),
  updatesStream => Atom.make(updatesStream),
  Atom.withLabel('portMap'),
  Atom.debounce(Duration.millis(20)),
  Atom.withServerValueInitial,
)

export const getPortsOfSpecificTypeAtom = Atom.family(
  <T extends MIDIPortType | undefined = MIDIPortType>(expectedPortType: T) =>
    Atom.make(
      get =>
        Effect.map(
          get.result(portMapAtom),
          EFunction.flow(
            Record.values,
            EArray.filter(
              candidatePort =>
                !expectedPortType || candidatePort.type === expectedPortType,
            ),
          ),
        ) as MapPortTypeFilterArgToEffect<T>,
    ).pipe(Atom.withLabel('portsOfSpecificType')),
)

export type CleanupPortType<T extends MIDIPortType | undefined> = [T] extends [
  'input',
]
  ? T
  : [T] extends ['output']
    ? T
    : MIDIPortType

export interface MapPortTypeFilterArgToPort<T extends MIDIPortType | undefined>
  extends EMIDIPort.EMIDIPort<CleanupPortType<T>> {}

export interface MapPortTypeFilterArgToEffect<
  T extends MIDIPortType | undefined,
> extends Effect.Effect<
    MapPortTypeFilterArgToPort<T>[],
    | MIDIErrors.AbortError
    | MIDIErrors.UnderlyingSystemError
    | MIDIErrors.MIDIAccessNotSupportedError
    | MIDIErrors.MIDIAccessNotAllowedError
  > {}
