/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
/** biome-ignore-all lint/correctness/noUnusedImports: it's a prototype, so I don't care for now> */
'use client'
import { Atom, useAtomValue } from '@effect-atom/atom-react'
import { styled } from '@linaria/react'
import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import type * as EMIDIPort from 'effect-web-midi/EMIDIPort'
import { ConnectionEventsLog } from './lib/ConnectionEventsLog.tsx'
import { MessageEventsLog } from './lib/MessageEventsLog.tsx'
import { MIDIDeviceSelect } from './lib/MIDIDeviceSelect.tsx'
import { MidiPadSlide } from './lib/MidiPadSlide.tsx'
import { RequestDumpButton } from './lib/RequestDumpButton.tsx'

const ROWS = 8
const COLUMNS = 8

const selectedInputIdAtom = Atom.make(null as EMIDIInput.Id | null)

export const readonlySelectedInputIdAtom = Atom.make(get =>
  get(selectedInputIdAtom),
)

export default function Home() {
  const selectedId = useAtomValue(readonlySelectedInputIdAtom)

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
        Inputs:{' '}
        <MIDIDeviceSelect
          selectedIdAtom={selectedInputIdAtom}
          typeToShowExclusively="input"
        />
        <MessageEventsLog selectedId={selectedId} />
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
