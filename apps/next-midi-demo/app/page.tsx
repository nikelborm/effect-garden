/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
/** biome-ignore-all lint/correctness/noUnusedImports: it's a prototype, so I don't care for now> */
'use client'

import * as EAudioContext from 'effect-web-audio/EAudioContext'
import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import { styled } from 'next-yak'
import { useEffect, useState } from 'react'

import { makeRunMain } from '@effect/platform/Runtime'
import * as Atom from '@effect-atom/atom/Atom'
import * as Hooks from '@effect-atom/atom-react/Hooks'
import * as Effect from 'effect/Effect'

import { ConnectionEventsLog } from './components/ConnectionEventsLog.tsx'
// import { fetchAudioAsset, runnable } from './lib/dataFetcher.ts'
import { MessageEventsLog } from './components/MessageEventsLog.tsx'
import { MIDIDeviceSelect } from './components/MIDIDeviceSelect.tsx'
import { MidiPadSlide } from './components/MidiPadSlide.tsx'

// const fetcherAtom = Atom.make(
//   Effect.gen(function* () {
//     const asset = yield* fetchAudioAsset({
//       _tag: 'pattern',
//       pattern: 1,
//       noteIndex: 26,
//       strength: 'm',
//     })

//     EAudioContext.decodeAudioData(asset.buffer)
//   }),
// )

// const selectedInputIdAtom = Atom.make(null as EMIDIInput.Id | null)

export const runMain = makeRunMain(({ fiber }) => {
  addEventListener('beforeunload', () => {
    fiber.unsafeInterruptAsFork(fiber.id())
  })
})

export default function Home() {
  // const selectedId = Hooks.useAtomValue(selectedInputIdAtom)
  // Hooks.useAtomMount(fetcherAtom)
  const [state, setFlag] = useState(true)

  // useEffect(() => {
  //   const id = setTimeout(() => setFlag(false), 10000)
  //   return () => {
  //     clearTimeout(id)
  //   }
  // })

  return (
    <>
      {state ? <MidiPadSlide /> : null}
      {/* <Separator />
      <Wrapper>
        <Header>Connection events</Header>
        <ConnectionEventsLog />
        <Separator />
        <Header>Message events</Header>
        <RequestDumpButton />
        Inputs:{' '}
        <MIDIDeviceSelect
          selectedIdAtom={selectedInputIdAtom}
          typeToShowExclusively="input"
        />
        <MessageEventsLog selectedId={selectedId} />
        <Separator />
      </Wrapper> */}
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
