'use client'

import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import type * as EMIDIPort from 'effect-web-midi/EMIDIPort'
import type * as MIDIErrors from 'effect-web-midi/MIDIErrors'
import * as Parsing from 'effect-web-midi/Parsing'
import * as Util from 'effect-web-midi/Util'

// import { Atom, Result } from '@effect-atom/atom-react'
import * as Atom from '@effect-atom/atom/Atom'
import * as Result from '@effect-atom/atom/Result'
import * as EArray from 'effect/Array'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import { pipe } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Predicate from 'effect/Predicate'
import * as Record from 'effect/Record'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'

import type * as MIDIValues from './branded/MIDIValues.ts'
import type * as StoreValues from './branded/StoreValues.ts'
import type { VirtualMIDIPadButton } from './stateTypes.ts'

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

export const makeKeyboardSliceMapAtom = <
  const SelectedKeys extends StoreValues.NonPrintableKeyboardKeys,
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

export const getAssignedKeyboardKeyInfoByKeyboardKey = (
  _keyboardKey: StoreValues.ValidKeyboardKey,
) => Atom.make(_get => {})

// get(keyboardKey: ValidKeyboardKey): AssignedKeyboardKeyInfo {
//     return this.store.get(keyboardKey) ?? { keyboardKeyPressState: NotPressed }
//   }

//   get(id: MIDINoteId): AssignedMIDIDeviceNote {
//     return this.store.get(id) ?? { midiPadPress: { state: NotPressed } }
//   }

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

// export const getCellOfActiveLayoutByCellIdAtom = Atom.family(
//   (id: RegisteredButtonID) =>
//     Atom.make(get =>
//       Option.map(get(activeLayoutAtom), layout =>
//         layout.virtualMIDIPadButtons.assertiveGet(id),
//       ),
//     ).pipe(Atom.withLabel('cellOfActiveLayout')),
// )

export const virtualMIDIPadButtonsWithActivations = Atom.make(get =>
  Option.map(get(activeLayoutAtom), layout => {
    const map = new Map<
      StoreValues.RegisteredButtonID,
      {
        pressedByKeyboardKeys: Set<StoreValues.ValidKeyboardKey>
        pressedByMIDIPadButtons: Set<MIDIValues.NoteId>
      }
    >()
    for (const [
      keyboardKey,
      virtualMIDIPadButton,
    ] of layout.keyboardKeyToVirtualMIDIPadButtonMap) {
      if (!('assignedToVirtualMIDIPadButtonId' in virtualMIDIPadButton))
        continue

      const id = virtualMIDIPadButton.assignedToVirtualMIDIPadButtonId
      let curState = map.get(id)
      if (!curState) {
        const newState = {
          pressedByKeyboardKeys: new Set<never>(),
          pressedByMIDIPadButtons: new Set<never>(),
        }
        map.set(id, newState)
        curState = newState
      }
      curState.pressedByKeyboardKeys.add(keyboardKey)
    }

    for (const [
      physicalMIDIDeviceNote,
      virtualMIDIPadButton,
    ] of layout.physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap) {
      if (!('assignedToVirtualMIDIPadButtonId' in virtualMIDIPadButton))
        continue

      const id = virtualMIDIPadButton.assignedToVirtualMIDIPadButtonId
      let curState = map.get(id)
      if (!curState) {
        const newState = {
          pressedByKeyboardKeys: new Set<never>(),
          pressedByMIDIPadButtons: new Set<never>(),
        }
        map.set(id, newState)
        curState = newState
      }
      curState.pressedByMIDIPadButtons.add(physicalMIDIDeviceNote)
    }

    return map
  }),
)

export const getPressureStateOfButton = Atom.family(
  (buttonId: StoreValues.RegisteredButtonID) =>
    Atom.make(get =>
      Option.map(
        get(virtualMIDIPadButtonsWithActivations),
        activations =>
          activations.get(buttonId) ?? {
            pressedByKeyboardKeys: new Set<StoreValues.ValidKeyboardKey>(),
            pressedByMIDIPadButtons: new Set<MIDIValues.NoteId>(),
          },
      ),
    ),
)

export const isButtonPressed = Atom.family(
  (buttonId: StoreValues.RegisteredButtonID) =>
    Atom.make(get =>
      Option.map(
        get(getPressureStateOfButton(buttonId)),
        state =>
          !!state.pressedByKeyboardKeys.size ||
          !!state.pressedByMIDIPadButtons.size,
      ),
    ),
)

export const getVirtualMIDIPadButtonByKeyboardKeyId = Atom.family(
  (key: StoreValues.ValidKeyboardKey) =>
    Atom.make(get =>
      Option.map(get(activeLayoutAtom), layout =>
        layout.keyboardKeyToVirtualMIDIPadButtonMap.get(key),
      ),
    ),
)

export const getVirtualMIDIPadButtonByPhysicalMIDIDeviceNote = Atom.family(
  (physicalMIDIDeviceNote: MIDIValues.NoteId) =>
    Atom.make(get =>
      Option.map(get(activeLayoutAtom), layout =>
        layout.physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap.get(
          physicalMIDIDeviceNote,
        ),
      ),
    ),
)

export const focusedCellOfActiveLayoutAtom = Atom.writable<
  VirtualMIDIPadButton | null,
  StoreValues.RegisteredButtonID | Atom.Reset
>(
  () => null,
  (ctx, value: StoreValues.RegisteredButtonID | Atom.Reset) =>
    ctx.setSelf(
      value === Atom.Reset
        ? null
        : Option.getOrThrowWith(
            ctx.get(activeLayoutAtom),
            () => new Error('Cannot set focused cell when no layout is active'),
          ).virtualMIDIPadButtons.assertiveGet(value),
    ),
).pipe(Atom.withLabel('currentFocusedCell'))

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
