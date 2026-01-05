import {
  type Atom,
  Result,
  useAtomSet,
  useAtomValue,
} from '@effect-atom/atom-react'
import { styled } from '@linaria/react'
import * as EArray from 'effect/Array'
import * as EFunction from 'effect/Function'
import * as EString from 'effect/String'
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
} from '@/components/Select'
import { type CleanupPortType, getPortsOfSpecificTypeAtom } from './state.ts'

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
    getPortsOfSpecificTypeAtom(typeToShowExclusively),
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
