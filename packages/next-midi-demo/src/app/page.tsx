/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'
import { styled } from '@linaria/react'
import { ConnectionEventsLog } from './lib/ConnectionEventsLog.tsx'
import { MessageEventsLog } from './lib/MessageEventsLog.tsx'
import { RequestDumpButton } from './lib/RequestDumpButton.tsx'

export default function Home() {
  return (
    <Wrapper>
      <RequestDumpButton />
      <hr />
      <ConnectionEventsLog />
      <hr />
      <MessageEventsLog />
    </Wrapper>
  )
}

const Wrapper = styled.div`
  color: wheat;
`
const Button = styled.button`

`
