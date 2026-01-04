import { Atom, Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { styled } from '@linaria/react'
import * as EArray from 'effect/Array'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Record from 'effect/Record'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'
import * as EString from 'effect/String'
import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import type * as MIDIErrors from 'effect-web-midi/MIDIErrors'
import * as EMIDIPort from 'effect-web-midi/EMIDIPort'
import {
  ChevronUpDownSVG,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemIndicatorIcon,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectScrollDownArrow,
  SelectScrollUpArrow,
  SelectTrigger,
  SelectValue,
} from '@/components/Select'

type UpdatePortMapFn = (
  portMap: EMIDIPort.IdToInstanceMap,
) => EMIDIPort.IdToInstanceMap

const portMapAtom = Effect.gen(function* () {
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
  Atom.debounce(Duration.millis(20)),
  Atom.withServerValueInitial,
)

const filteredPortAtom = Atom.family(
  <T extends MIDIPortType | undefined = MIDIPortType>(showOnly: T) =>
    Atom.make(
      get =>
        Effect.map(
          get.result(portMapAtom),
          EFunction.flow(
            Record.values,
            EArray.filter(port => !showOnly || port.type === showOnly),
          ),
        ) as MapPortTypeFilterArgToEffect<T>,
    ),
)

type CleanupPortType<T extends MIDIPortType | undefined> = [T] extends ['input']
  ? T
  : [T] extends ['output']
    ? T
    : MIDIPortType

type MapPortTypeFilterArgToPort<T extends MIDIPortType | undefined> =
  EMIDIPort.EMIDIPort<CleanupPortType<T>>

type MapPortTypeFilterArgToEffect<T extends MIDIPortType | undefined> =
  Effect.Effect<
    MapPortTypeFilterArgToPort<T>[],
    | MIDIErrors.AbortError
    | MIDIErrors.UnderlyingSystemError
    | MIDIErrors.MIDIAccessNotSupportedError
    | MIDIErrors.MIDIAccessNotAllowedError
  >

export const MIDIDeviceSelect = <
  TPortType extends MIDIPortType | undefined = MIDIPortType,
>({
  selectedIdAtom,
  typeToShowExclusively,
}: {
  typeToShowExclusively?: TPortType
  selectedIdAtom: Atom.Writable<
    EMIDIPort.Id<CleanupPortType<NoInfer<TPortType>>> | null,
    EMIDIPort.Id<CleanupPortType<NoInfer<TPortType>>> | null
  >
}) => {
  const filteredPortsResult = useAtomValue(
    filteredPortAtom(typeToShowExclusively),
  )
  console.log('MIDIDeviceSelect rendered: ', filteredPortsResult)

  const setSelectedId = useAtomSet(selectedIdAtom)

  return Result.matchWithError(filteredPortsResult, {
    onDefect: defect => {
      console.log('defect', defect)
      throw defect
    },
    onError: error => <span>Error: {error._tag}</span>,
    onInitial: () => (
      <SelectRoot name="select_port" disabled>
        <SelectTrigger>
          <MonoPre>Loading ports...</MonoPre>
        </SelectTrigger>
      </SelectRoot>
    ),
    onSuccess: ({ value: filteredPorts }) => {
      return (
        <SelectRoot<EMIDIPort.Id<CleanupPortType<TPortType>> | null>
          onValueChange={setSelectedId}
          name="select_port"
          items={EFunction.pipe(
            filteredPorts,
            EArray.map(port => ({
              label: (
                <PortLabel port={port} showType={!typeToShowExclusively} />
              ),
              value: port.id,
            })),
            EArray.append({
              label: <MonoPre>Select port ID</MonoPre>,
              value: null,
            }),
          )}
        >
          <SelectTrigger>
            <SelectValue />
            <SelectIcon>
              <ChevronUpDownSVG />
            </SelectIcon>
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner sideOffset={8}>
              <SelectPopup>
                <SelectScrollUpArrow />
                <SelectList>
                  {EFunction.pipe(
                    EArray.map(filteredPorts, port => (
                      <SelectItem key={port.id} value={port.id}>
                        <SelectItemIndicator>
                          <SelectItemIndicatorIcon />
                        </SelectItemIndicator>
                        <SelectItemText>
                          <PortLabel
                            port={port}
                            // only show the type annotation when the type of
                            // elements is not obvious
                            showType={!typeToShowExclusively}
                          />
                        </SelectItemText>
                      </SelectItem>
                    )),
                  )}
                </SelectList>
                <SelectScrollDownArrow />
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
      )
    },
  })
}

const PortLabel = ({
  port,
  showType,
}: {
  port: EMIDIPort.EMIDIPort
  showType?: boolean | undefined
}) => (
  <MonoPre title={`id=${port.id}`}>
    {showType ? EString.capitalize(port.type.padEnd(7)) : ''}
    {port.name}
  </MonoPre>
)

const MonoPre = styled.pre`
  display: inline;
  font-family: monospace;
`
