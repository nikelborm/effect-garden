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
import * as SortedMap from 'effect/SortedMap'
import * as SortedSet from 'effect/SortedSet'
import * as Stream from 'effect/Stream'

import { ButtonState } from './branded/index.ts'
import * as MIDIValues from './branded/MIDIValues.ts'
import * as StoreValues from './branded/StoreValues.ts'
import { layoutAtom, layoutWidthAtom } from './state/Layout.ts'
import { setPhysicalButtonState } from './state/PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap.ts'
import {
  assertiveGetButtonById,
  registeredButtonIdsAtom,
  type VirtualMIDIPadButton,
} from './state/VirtualMIDIPadButtonsMap.ts'

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
      ).pipe(Atom.withLabel('messagesStringLog'))
    : pipe(
        EMIDIInput.makeMessagesStreamById(inputId),
        Parsing.withParsedDataField,
        Parsing.withTouchpadPositionUpdates,
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
        Atom.withLabel('messagesStringLog'),
        Atom.keepAlive,
        Atom.withServerValueInitial,
      ),
)

export const getNotePressReleaseEventsAtom: (
  arg: EMIDIInput.Id | null,
) => Atom.Atom<
  Result.Result<
    Parsing.ParsedMIDIMessage<
      Parsing.NotePressPayload | Parsing.NoteReleasePayload
    >,
    | MIDIErrors.AbortError
    | MIDIErrors.MIDIAccessNotAllowedError
    | MIDIErrors.MIDIAccessNotSupportedError
    | MIDIErrors.UnderlyingSystemError
  >
> = Atom.family((inputId: EMIDIInput.Id | null) =>
  !inputId
    ? Atom.make(Stream.empty).pipe(Atom.withLabel('notePressReleaseEvents'))
    : pipe(
        EMIDIInput.makeMessagesStreamById(inputId),
        Stream.catchTag('PortNotFound', () =>
          Stream.dieMessage('it should not be possible to pass invalid id'),
        ),
        Parsing.withParsedDataField,
        Parsing.withTouchpadPositionUpdates,
        Stream.filter(Predicate.or(Parsing.isNoteRelease, Parsing.isNotePress)),
        Stream.provideLayer(
          EMIDIAccess.layerSystemExclusiveAndSoftwareSynthSupported,
        ),
        Stream.tap(({ midiMessage }) =>
          Atom.set(setPhysicalButtonState, {
            midiPadPress:
              midiMessage._tag === 'Note Press'
                ? ButtonState.Pressed
                : ButtonState.NotPressed,
            physicalMIDIDeviceNote: MIDIValues.NoteId(midiMessage.note),
          }),
        ),
        messageEventLogStream => Atom.make(messageEventLogStream),
        Atom.withLabel('notePressReleaseEvents'),
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

export const getRowOfIdsOfLayoutAtom = Atom.family((rowIndex: number) =>
  Atom.make(get => {
    const width = get(layoutWidthAtom)
    const ids = get(registeredButtonIdsAtom)
    return ids.slice(rowIndex * width, (rowIndex + 1) * width)
  }).pipe(Atom.withLabel('rowOfIdsOfLayout')),
)

// export const getCellOfLayoutByCellIdAtom = Atom.family(
//   (id: RegisteredButtonID) =>
//     Atom.make(get =>
//       Option.map(get(layoutAtom), layout =>
//         layout.virtualMIDIPadButtons.assertiveGet(id),
//       ),
//     ).pipe(Atom.withLabel('cellOfLayout')),
// )

export const virtualMIDIPadButtonsWithActivations = Atom.make(get => {
  const layout = get(layoutAtom)

  let map = SortedMap.empty<
    StoreValues.RegisteredButtonID,
    {
      pressedByKeyboardKeys: SortedSet.SortedSet<StoreValues.ValidKeyboardKey>
      pressedByMIDIPadButtons: SortedSet.SortedSet<MIDIValues.NoteId>
    }
  >(StoreValues.RegisteredButtonIdOrder)

  const getOrDefault = (buttonId: StoreValues.RegisteredButtonID) =>
    pipe(
      SortedMap.get(map, buttonId),
      Option.orElseSome(() => ({
        pressedByKeyboardKeys: SortedSet.empty(
          StoreValues.ValidKeyboardKeyOrder,
        ),
        pressedByMIDIPadButtons: SortedSet.empty(MIDIValues.NoteIdOrder),
      })),
      Option.getOrThrow,
    )

  for (const [
    keyboardKey,
    assignedKeyboardKeyInfo,
  ] of layout.keyboardKeyToVirtualMIDIPadButtonMap) {
    if (!('assignedToVirtualMIDIPadButtonId' in assignedKeyboardKeyInfo))
      continue

    const buttonId = assignedKeyboardKeyInfo.assignedToVirtualMIDIPadButtonId

    map = pipe(
      getOrDefault(buttonId),
      button => ({
        ...button,
        pressedByKeyboardKeys:
          assignedKeyboardKeyInfo.keyboardKeyPressState === ButtonState.Pressed
            ? SortedSet.add(button.pressedByKeyboardKeys, keyboardKey)
            : button.pressedByKeyboardKeys,
      }),
      newState => SortedMap.set(map, buttonId, newState),
    )
  }

  for (const [
    physicalMIDIDeviceNote,
    assignedMIDIDeviceNote,
  ] of layout.physicalMIDIDeviceNoteToVirtualMIDIPadButtonMap) {
    if (!('assignedToVirtualMIDIPadButtonId' in assignedMIDIDeviceNote))
      continue

    const buttonId = assignedMIDIDeviceNote.assignedToVirtualMIDIPadButtonId

    map = pipe(
      getOrDefault(buttonId),
      button => ({
        ...button,
        pressedByMIDIPadButtons:
          assignedMIDIDeviceNote.midiPadPress === ButtonState.Pressed
            ? SortedSet.add(
                button.pressedByMIDIPadButtons,
                physicalMIDIDeviceNote,
              )
            : button.pressedByMIDIPadButtons,
      }),
      newState => SortedMap.set(map, buttonId, newState),
    )
  }

  console.log(
    'virtualMIDIPadButtonsWithActivations: ',
    pipe(
      Record.fromEntries(SortedMap.entries(map)),
      Record.map(val => ({
        pressedByKeyboardKeys: [...SortedSet.values(val.pressedByKeyboardKeys)],
        pressedByMIDIPadButtons: [
          ...SortedSet.values(val.pressedByMIDIPadButtons),
        ],
      })),
    ),
  )

  return map
})

export const getPressureStateOfButton: (
  buttonId: StoreValues.RegisteredButtonID,
) => Atom.Atom<{
  pressedByKeyboardKeys: SortedSet.SortedSet<StoreValues.ValidKeyboardKey>
  pressedByMIDIPadButtons: SortedSet.SortedSet<MIDIValues.NoteId>
}> = Atom.family((buttonId: StoreValues.RegisteredButtonID) =>
  Atom.make(get =>
    pipe(
      get(virtualMIDIPadButtonsWithActivations),
      SortedMap.get(buttonId),
      Option.orElseSome(() => ({
        pressedByKeyboardKeys: SortedSet.empty(
          StoreValues.ValidKeyboardKeyOrder,
        ),
        pressedByMIDIPadButtons: SortedSet.empty(MIDIValues.NoteIdOrder),
      })),
      Option.getOrThrow,
    ),
  ),
)

export const isButtonPressed = Atom.family(
  (buttonId: StoreValues.RegisteredButtonID) =>
    Atom.make(get => {
      const state = get(getPressureStateOfButton(buttonId))
      return (
        !!SortedSet.size(state.pressedByKeyboardKeys) ||
        !!SortedSet.size(state.pressedByMIDIPadButtons)
      )
    }),
)

// export const getVirtualMIDIPadButtonByKeyboardKeyId = Atom.family(
//   (key: StoreValues.ValidKeyboardKey) =>
//     Atom.make(get => {
//       const layout = get(layoutAtom)
//       return layout.keyboardKeyToVirtualMIDIPadButtonMap.get(key)
//     }),
// )

export const focusedCellOfLayoutAtom = Atom.writable<
  VirtualMIDIPadButton | null,
  StoreValues.RegisteredButtonID | Atom.Reset
>(
  () => null,
  (ctx, value: StoreValues.RegisteredButtonID | Atom.Reset) =>
    ctx.setSelf(
      value === Atom.Reset ? null : ctx.get(assertiveGetButtonById(value)),
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
