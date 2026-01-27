/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'

import * as Result from '@effect-atom/atom/Result'
import * as Hooks from '@effect-atom/atom-react/Hooks'
import * as Cause from 'effect/Cause'

import { MIDIDeviceConnectionEventsStringLogAtom } from './atoms/MIDIDeviceConnectionEventsStringLogAtom.ts'

export const ConnectionEventsLog = () => {
  const text = Hooks.useAtomValue(MIDIDeviceConnectionEventsStringLogAtom)

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
        No connection events happened yet. initial waiting:{' '}
        {e.waiting.toString()}
      </pre>
    ),
    onSuccess: s => <pre>{s.value}</pre>,
  })
}
