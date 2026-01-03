import { Atom, Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { styled } from '@linaria/react'
import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Record from 'effect/Record'
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

const FullRecordAtom = Atom.make(
  () =>
    EMIDIAccess.AllPortsRecord.pipe(
      // Effect.tap(Effect.sleep(Duration.seconds(5))),
      // Effect.tap(Console.log),
      Effect.provide(EMIDIAccess.layerMostRestricted),
    ),
  { initialValue: {} },
).pipe(Atom.withServerValueInitial)

const selectedId = Atom.make(null as EMIDIPort.BothId | null)

export const readonlySelectedId = Atom.make(get => get(selectedId))

export const MIDIDeviceSelect = () => {
  const FullRecordResult = useAtomValue(FullRecordAtom)

  const setSelectedId = useAtomSet(selectedId)

  return Result.matchWithWaiting(FullRecordResult, {
    onDefect: defect => {
      throw defect
    },
    onError: (error, _) => <span>Error: {error._tag}</span>,
    onWaiting: _ => (
      <SelectRoot disabled>
        <SelectTrigger>
          <MonoPre>Loading ports...</MonoPre>
        </SelectTrigger>
      </SelectRoot>
    ),
    onSuccess: ({ value: portMap }) => (
      <SelectRoot<EMIDIPort.BothId | null>
        onValueChange={e => {
          setSelectedId(e)
        }}
        items={EFunction.pipe(
          portMap,
          Record.values,
          EArray.map(port => ({
            label: <PortLabel port={port} />,
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
                {EArray.map(Record.values(portMap), port => (
                  <SelectItem key={port.id} value={port.id}>
                    <SelectItemIndicator>
                      <SelectItemIndicatorIcon />
                    </SelectItemIndicator>
                    <SelectItemText>
                      <PortLabel port={port} />
                    </SelectItemText>
                  </SelectItem>
                ))}
              </SelectList>
              <SelectScrollDownArrow />
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>
    ),
  })
}

const PortLabel = ({ port }: { port: EMIDIPort.EMIDIPort }) => (
  <MonoPre>
    {EString.capitalize(port.type.padEnd(6))} {port.name} id=
    {port.id.slice(-10)}
  </MonoPre>
)

const MonoPre = styled.pre`
  display: inline;
  font-family: monospace;
`
