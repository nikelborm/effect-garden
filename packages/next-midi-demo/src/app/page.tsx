/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
/** biome-ignore-all lint/correctness/noUnusedImports: it's a prototype, so I don't care for now> */
'use client'
import { useAtomValue } from '@effect-atom/atom-react'
import { styled } from '@linaria/react'
import { ConnectionEventsLog } from './lib/ConnectionEventsLog.tsx'
import { MessageEventsLog } from './lib/MessageEventsLog.tsx'
import {
  MIDIDeviceSelect,
  readonlySelectedId,
} from './lib/MIDIDeviceSelect.tsx'
import { MidiPadSlide } from './lib/MidiPadSlide.tsx'
import { RequestDumpButton } from './lib/RequestDumpButton.tsx'

const ROWS = 8
const COLUMNS = 8

export default function Home() {
  const selectedId = useAtomValue(readonlySelectedId)

  return (
    <>
      {/* <MidiPadSlide />
      <Separator /> */}
      <Wrapper>
        <Header>Connection events</Header>
        <ConnectionEventsLog />
        <Separator />
        <Header>Message events</Header>
        {/* <RequestDumpButton /> */}
        Inputs: <MIDIDeviceSelect />
        <MessageEventsLog />
        <Separator />
      </Wrapper>
    </>
  )
}

const Separator = styled.div`
  width:  100px;
  height: 300px;
`

const Wrapper = styled.div`
  color: wheat;
  padding: 40px;
`

const Header = styled.h3`
  /* margin-top: 20px;   */
  border-top: 1px solid white;
`
