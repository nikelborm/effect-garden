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
import type * as EMIDIPort from 'effect-web-midi/EMIDIPort'
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
} from './Select.tsx'

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
  Stream.provideLayer(EMIDIAccess.layerMostRestricted),
  portMapUpdatesStream => Atom.make(portMapUpdatesStream),
  Atom.debounce(Duration.millis(20)),
  Atom.withServerValueInitial,
)

const selectedId = Atom.make(null as EMIDIPort.BothId | null)

export const readonlySelectedId = Atom.make(get => get(selectedId))

export const MIDIDeviceSelect = ({
  typeToShowExclusively,
}: {
  typeToShowExclusively?: 'input' | 'output' | undefined
}) => {
  const portMapResult = useAtomValue(portMapAtom)
  console.log('MIDIDeviceSelect rendered: ', portMapResult)

  const setSelectedId = useAtomSet(selectedId)

  return Result.matchWithError(portMapResult, {
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
    onSuccess: ({ value: portMap }) => {
      const filteredPorts = EArray.filter(
        Record.values(portMap),
        port => !typeToShowExclusively || port.type === typeToShowExclusively,
      )
      return (
        <SelectRoot<EMIDIPort.BothId | null>
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
