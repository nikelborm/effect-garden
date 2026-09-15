'use client'

import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'

import * as Hooks from '@effect/atom-react/Hooks'
import * as Cause from 'effect/Cause'
import * as AsyncResult from 'effect/unstable/reactivity/AsyncResult'

import { getMessagesLogAtom } from '../atoms/getMessagesLogAtom.ts'

export const MessageEventsLog = ({
  selectedId = null,
}: {
  selectedId: EMIDIInput.Id | null
}) => {
  const text = Hooks.useAtomValue(getMessagesLogAtom(selectedId))

  return AsyncResult.match(text, {
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
