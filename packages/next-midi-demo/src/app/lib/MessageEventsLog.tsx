/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'
import { Result, useAtomValue } from '@effect-atom/atom-react'
import * as Cause from 'effect/Cause'
import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import { getMessagesLogAtom } from './state.ts'

export const MessageEventsLog = ({
  selectedId = null,
}: {
  selectedId: EMIDIInput.Id | null
}) => {
  const text = useAtomValue(getMessagesLogAtom(selectedId))

  return Result.match(text, {
    onFailure: _ => (
      <>
        failure:
        <br />
        {Cause.pretty(_.cause)}
      </>
    ),
    onInitial: e => (
      <pre>
        No message events happened yet. initial waiting: {e.waiting.toString()}
      </pre>
    ),
    onSuccess: s => <pre>{s.value}</pre>,
  })
}
