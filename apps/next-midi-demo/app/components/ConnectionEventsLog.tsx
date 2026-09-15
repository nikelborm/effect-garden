'use client'

import * as Hooks from '@effect/atom-react/Hooks'
import * as Cause from 'effect/Cause'
import * as AsyncResult from 'effect/unstable/reactivity/AsyncResult'

import { MIDIDeviceConnectionEventsStringLogAtom } from '../atoms/MIDIDeviceConnectionEventsStringLogAtom.ts'

export const ConnectionEventsLog = () => {
  const text = Hooks.useAtomValue(MIDIDeviceConnectionEventsStringLogAtom)

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
        No connection events happened yet. initial waiting:{' '}
        {e.waiting.toString()}
      </pre>
    ),
    onSuccess: s => <pre>{s.value}</pre>,
  })
}
