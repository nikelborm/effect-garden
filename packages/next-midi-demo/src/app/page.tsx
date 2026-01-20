/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
/** biome-ignore-all lint/correctness/noUnusedImports: it's a prototype, so I don't care for now> */
'use client'

import { styled } from '@linaria/react'
import * as EAudioContext from 'effect-web-audio/EAudioContext'
import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'

import * as Atom from '@effect-atom/atom/Atom'
import * as Hooks from '@effect-atom/atom-react/Hooks'
import * as Effect from 'effect/Effect'

import { ConnectionEventsLog } from './lib/ConnectionEventsLog.tsx'
import { fetchAudioAsset, runnable } from './lib/dataFetcher.ts'
import { MessageEventsLog } from './lib/MessageEventsLog.tsx'
import { MIDIDeviceSelect } from './lib/MIDIDeviceSelect.tsx'
import { MidiPadSlide } from './lib/MidiPadSlide.tsx'

const fetcherAtom = Atom.make(
  Effect.gen(function* () {
    const asset = yield* fetchAudioAsset({
      _tag: 'pattern',
      patternIndex: 1,
      noteIndex: 26,
      strength: 'm',
    })

    EAudioContext.decodeAudioData(asset.buffer)
  }),
)

const selectedInputIdAtom = Atom.make(null as EMIDIInput.Id | null)

export default function Home() {
  const selectedId = Hooks.useAtomValue(selectedInputIdAtom)
  Hooks.useAtomMount(fetcherAtom)

  return (
    <>
      <MidiPadSlide selectedInputPortId={selectedId} />
      <Separator />
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
