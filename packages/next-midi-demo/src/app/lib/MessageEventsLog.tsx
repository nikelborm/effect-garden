/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'

import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'

import * as Result from '@effect-atom/atom/Result'
import * as Hooks from '@effect-atom/atom-react/Hooks'
import * as Cause from 'effect/Cause'

import { getMessagesLogAtom } from './atoms/getMessagesLogAtom.ts'

export const MessageEventsLog = ({
  selectedId = null,
}: {
  selectedId: EMIDIInput.Id | null
}) => {
  const text = Hooks.useAtomValue(getMessagesLogAtom(selectedId))

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
