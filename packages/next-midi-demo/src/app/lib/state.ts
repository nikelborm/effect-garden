'use client'
import { Atom, Result } from '@effect-atom/atom-react'
import * as EArray from 'effect/Array'
import * as Brand from 'effect/Brand'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import { pipe } from 'effect/Function'
import * as Option from 'effect/Option'
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
import * as NonPrintableKey from 'ts-key-not-enum'

export type NonPrintableKeyboardKeys =
  (typeof NonPrintableKey)[keyof typeof NonPrintableKey]

export type ValidKeyboardKey = string & Brand.Brand<'ValidKeyboardKey'>

export const ValidKeyboardKey = Brand.refined<ValidKeyboardKey>(
  // the second check is needed to ensure length of string of 1 Unicode
  // character instead of checking for it to be 1 byte
  key => key in NonPrintableKey || [...key].length === 1,
  key =>
    Brand.error(
      `Expected "${key}" to be either a valid non-printable key name, or a single unicode symbol`,
    ),
)

export const getMessagesLogAtom: (
  inputId: EMIDIInput.Id | null,
) => Atom.Atom<
  Result.Result<
    string,
    | MIDIErrors.AbortError
    | MIDIErrors.UnderlyingSystemError
    | MIDIErrors.MIDIAccessNotAllowedError
    | MIDIErrors.PortNotFoundError
  >
> = Atom.family(inputId =>
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

export interface ButtonCoordinates {
  rowIndex: number
  columnIndex: number
}

export type MIDINoteId = number &
  Brand.Brand<'MIDINoteId: integer in range 0-127'>

export const MIDINoteId = Brand.refined<MIDINoteId>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 128,
  n => Brand.error(`Expected ${n} to be an integer in range 0-127`),
)

export type RegisteredButtonID = string & Brand.Brand<'Registered button ID'>

export type Pressure = number & Brand.Brand<'Pressure: integer in range 1-127'>

export const Pressure = Brand.refined<Pressure>(
  n => Number.isSafeInteger(n) && n > 0 && n < 128,
  n => Brand.error(`Expected ${n} to be an integer in range 1-127`),
)

export type NoteInitialVelocity = Pressure & Brand.Brand<'NoteInitialVelocity'>

export const NoteInitialVelocity = Brand.all(
  Pressure,
  Brand.nominal<NoteInitialVelocity>(),
)

export type NoteCurrentPressure = Pressure & Brand.Brand<'NoteCurrentPressure'>

export const NoteCurrentPressure = Brand.all(
  Pressure,
  Brand.nominal<NoteCurrentPressure>(),
)

export type NotPressed = 0 & Brand.Brand<'Not pressed'>
export const NotPressed = 0 as NotPressed

export type Pressed = 1 & Brand.Brand<'Pressed'>
export const Pressed = 1 as Pressed

export type PressedContinuously = 2 & Brand.Brand<'Pressed continuously'>
export const PressedContinuously = 2 as PressedContinuously

export const isNotPressed = (state: unknown): state is NotPressed =>
  state === NotPressed
export const isPressed = (state: unknown): state is Pressed => state === Pressed
export const isPressedContinuously = (
  state: unknown,
): state is PressedContinuously => state === PressedContinuously

interface AssignedKeyboardKeyInfo {
  assignedToVirtualMIDIPadButtonId?: RegisteredButtonID
  keyboardKeyPressState: NotPressed | Pressed
}

type MIDIDeviceNotePressInfo =
  | { state: NotPressed }
  | { state: Pressed; initialAcquiredVelocity: NoteInitialVelocity }
  | {
      state: PressedContinuously
      initialAcquiredVelocity: NoteInitialVelocity
      latestContinuousPressure: NoteCurrentPressure
    }

interface AssignedMIDIDeviceNote {
  assignedToVirtualMIDIPadButtonId?: RegisteredButtonID
  midiPadPress: MIDIDeviceNotePressInfo
}

interface VirtualMIDIPadButton {
  id: RegisteredButtonID
  assignedMIDINote: MIDINoteId
  assignedSound: unknown
}

type LayoutId = string & Brand.Brand<'LayoutId'>

interface LayoutStore extends Record<LayoutId, Layout> {}

class LayoutMap {
  private readonly store: LayoutStore

  constructor(store: LayoutStore) {
    this.store = store
    this.assertiveGet = this.assertiveGet.bind(this)
  }

  assertiveGet(id: LayoutId) {
    const layout = this.store[id]

    if (!layout)
      throw new Error(
        "Attempted to get layout by id, that's not available in the layout store",
      )

    return layout
  }
}

type ToEntry<T extends object> = [keyof T, T[keyof T]]

export type KeyboardKeyToVirtualMIDIPadButtonMapStore = {
  [key in ValidKeyboardKey]?: AssignedKeyboardKeyInfo
}

export class KeyboardKeyToVirtualMIDIPadButtonMap {
  private readonly store: KeyboardKeyToVirtualMIDIPadButtonMapStore

  constructor(store: KeyboardKeyToVirtualMIDIPadButtonMapStore) {
    this.store = store
    this.get = this.get.bind(this)
  }

  get(keyboardKey: ValidKeyboardKey): AssignedKeyboardKeyInfo {
    return this.store[keyboardKey] ?? { keyboardKeyPressState: NotPressed }
  }

  isActive(id: RegisteredButtonID) {
    return Record.some(
      this.store as Record.ReadonlyRecord<
        ValidKeyboardKey,
        AssignedKeyboardKeyInfo
      >,
      value =>
        value.assignedToVirtualMIDIPadButtonId === id &&
        !isNotPressed(value.keyboardKeyPressState),
    )
  }
}

export type PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMapStore = {
  [id in MIDINoteId]?: AssignedMIDIDeviceNote
}

export class PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap {
  private readonly store: PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMapStore

  constructor(store: PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMapStore) {
    this.store = store
    this.get = this.get.bind(this)
  }

  get(id: MIDINoteId): AssignedMIDIDeviceNote {
    return this.store[id] ?? { midiPadPress: { state: NotPressed } }
  }

  isActive(id: RegisteredButtonID) {
    return Record.some(
      this.store as Record.ReadonlyRecord<
        ValidKeyboardKey,
        AssignedKeyboardKeyInfo
      >,
      value =>
        value.assignedToVirtualMIDIPadButtonId === id &&
        !isNotPressed(value.keyboardKeyPressState),
    )
  }
}

export interface VirtualMIDIPadButtonsMapStore
  extends Record<RegisteredButtonID, VirtualMIDIPadButton> {}

export class VirtualMIDIPadButtonsMap {
  private readonly store: VirtualMIDIPadButtonsMapStore
  constructor(store: VirtualMIDIPadButtonsMapStore) {
    this.store = store
    this.assertiveGet = this.assertiveGet.bind(this)
  }

  assertiveGet(id: RegisteredButtonID) {
    const button = this.store[id]

    if (!button)
      throw new Error(
        "Attempted to get button by id, that's not available in the button store",
      )

    return button
  }
}

export interface Layout {
  inputIdPreferences: EMIDIInput.Id[]
  width: number
  height: number
  keyboardKeyToVirtualMIDIPadButtonMap: KeyboardKeyToVirtualMIDIPadButtonMap
  physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap: PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap
  virtualMIDIPadButtons: VirtualMIDIPadButtonsMap
}

export const makeKeyboardSliceMapAtom = <
  const SelectedKeys extends NonPrintableKeyboardKeys,
  Ref extends GlobalEventHandlers,
>(
  keys: SelectedKeys[],
  ref?: Ref,
) => {
  const refWithFallback = ref ?? globalThis.document

  const keySet = new Set(keys)

  const stream = refWithFallback
    ? Stream.filterMap(
        Stream.fromEventListener<KeyboardEvent>(refWithFallback, 'keydown', {
          bufferSize: 0,
        }),
        ({ key }) =>
          keySet.has(key as SelectedKeys) ? Option.some(key) : Option.none(),
      )
    : Stream.empty

  return { stream, atom: Atom.make(stream) }
}

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

export const layoutStoreAtom = Atom.make<LayoutMap>(
  new LayoutMap({
    ['main' as LayoutId]: {
      width,
      height,

      inputIdPreferences: [
        EMIDIInput.Id(
          'EFE87192AEC369B27A01D61D0727D8ADF620A34131385F60C48E155102A544E4',
        ),
      ],
      keyboardKeyToVirtualMIDIPadButtonMap:
        new KeyboardKeyToVirtualMIDIPadButtonMap(
          Object.fromEntries(
            keyboardLayout.flatMap((row, rowIndex) => {
              const currentRowEntries: ToEntry<KeyboardKeyToVirtualMIDIPadButtonMapStore>[] =
                []

              for (const key of row) {
                const columnIndex = currentRowEntries.length
                const buttonIndex = rowIndex * width + columnIndex

                currentRowEntries.push([
                  ValidKeyboardKey(key),
                  {
                    assignedToVirtualMIDIPadButtonId:
                      `registered-button-id-${buttonIndex}` as RegisteredButtonID,
                    keyboardKeyPressState: NotPressed,
                  },
                ])
              }

              return currentRowEntries
            }),
          ),
        ),
      physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap:
        new PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap(
          Object.fromEntries(
            Array.from(
              { length: width * height },
              (_, buttonIndex) =>
                [
                  `registered-button-id-${buttonIndex}` as RegisteredButtonID,
                  {
                    assignedToVirtualMIDIPadButtonId:
                      `registered-button-id-${buttonIndex}` as RegisteredButtonID,
                    midiPadPress: { state: NotPressed },
                  },
                ] satisfies [RegisteredButtonID, AssignedMIDIDeviceNote],
            ),
          ),
        ),
      virtualMIDIPadButtons: new VirtualMIDIPadButtonsMap(
        Object.fromEntries(
          Array.from(
            { length: width * height },
            (_, buttonIndex) =>
              [
                `registered-button-id-${buttonIndex}` as RegisteredButtonID,
                {
                  id: `registered-button-id-${buttonIndex}` as RegisteredButtonID,
                  assignedMIDINote: MIDINoteId(buttonIndex),
                  assignedSound: Buffer.from([]),
                },
              ] satisfies [RegisteredButtonID, VirtualMIDIPadButton],
          ),
        ),
      ),
    },
  }),
).pipe(Atom.withLabel('layoutStore'))

/**
 * using null deselects it
 */
export const activeLayoutAtom = Atom.writable<
  Option.Option<Layout>,
  LayoutId | null
>(
  get => Option.some(get(layoutStoreAtom).assertiveGet('main' as LayoutId)),
  (ctx, activeLayoutId) => {
    if (!activeLayoutId) return ctx.setSelf(Option.none())

    ctx.set(focusedCellOfActiveLayoutAtom, Atom.Reset)

    ctx.setSelf(
      Option.some(ctx.get(layoutStoreAtom).assertiveGet(activeLayoutId)),
    )
  },
).pipe(Atom.withLabel('activeLayoutId'))

export const registeredButtonIdsOfActiveLayoutAtom = Atom.make(get =>
  Option.map(
    get(activeLayoutAtom),
    layout => Object.keys(layout.virtualMIDIPadButtons) as RegisteredButtonID[],
  ),
)

export const activeLayoutWidthAtom = Atom.make(get =>
  Option.map(get(activeLayoutAtom), _ => _.width),
).pipe(Atom.withLabel('activeLayoutWidth'))

export const activeLayoutHeightAtom = Atom.make(get =>
  Option.map(get(activeLayoutAtom), _ => _.height),
).pipe(Atom.withLabel('activeLayoutHeight'))

export const getRowOfIdsOfActiveLayoutAtom = Atom.family((rowIndex: number) =>
  Atom.make(get =>
    Option.map(
      Option.all([
        get(activeLayoutWidthAtom),
        get(registeredButtonIdsOfActiveLayoutAtom),
      ]),
      ([width, ids]) => ids.slice(rowIndex * width, (rowIndex + 1) * width),
    ),
  ).pipe(Atom.withLabel('rowOfIdsOfActiveLayout')),
)

export const getCellOfActiveLayoutByCellIdAtom = Atom.family(
  (id: RegisteredButtonID) =>
    Atom.make(get =>
      Option.map(get(activeLayoutAtom), layout =>
        layout.virtualMIDIPadButtons.assertiveGet(id),
      ),
    ).pipe(Atom.withLabel('cellOfActiveLayout')),
)

export const focusedCellOfActiveLayoutAtom = Atom.writable<
  VirtualMIDIPadButton | null,
  RegisteredButtonID | Atom.Reset
>(
  () => null,
  (ctx, value: RegisteredButtonID | Atom.Reset) =>
    ctx.setSelf(
      value === Atom.Reset
        ? null
        : Option.getOrThrowWith(
            ctx.get(activeLayoutAtom),
            () => new Error('Cannot set focused cell when no layout is active'),
          ).virtualMIDIPadButtons.assertiveGet(value),
    ),
).pipe(Atom.withLabel('currentFocusedCell'))

export const isButtonActiveAtom = Atom.family((id: RegisteredButtonID) =>
  Atom.make(get =>
    Option.map(
      get(activeLayoutAtom),
      layout =>
        layout.keyboardKeyToVirtualMIDIPadButtonMap.isActive(id) ||
        layout.physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap.isActive(id),
    ),
  ).pipe(Atom.withLabel('isButtonActive')),
)

//
// port maps
//

interface UpdatePortMapFn {
  /**
   *
   */
  (portMap: EMIDIPort.IdToInstanceMap): EMIDIPort.IdToInstanceMap
}

// export const keyDownEventsStream: Stream.Stream<
//   Key.ArrowLeft | Key.ArrowRight | Key.ArrowUp | Key.ArrowDown
// > =

// export const keyboardNavigationAtom = Atom.make(keyDownEventsStream)

// export const currentlyFocusedCellAtom = Atom.make()

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
