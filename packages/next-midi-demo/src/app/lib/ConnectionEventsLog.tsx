/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'

import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as Util from 'effect-web-midi/Util'

import * as Atom from '@effect-atom/atom/Atom'
import * as Result from '@effect-atom/atom/Result'
import * as Hooks from '@effect-atom/atom-react/Hooks'
import * as Cause from 'effect/Cause'
import * as EFunction from 'effect/Function'

const MIDIDeviceConnectionEventsStringLog = EFunction.pipe(
  EMIDIAccess.request(),
  EMIDIAccess.makeAllPortsStateChangesStream(),
  Util.mapToGlidingStringLogOfLimitedEntriesCount(50, 'latestFirst', _ => ({
    time: _.capturedAt.toISOString(),
    id: _.port.id.slice(-10),
    device: _.newState.ofDevice.padStart(12),
    connection: _.newState.ofConnection.padStart(7),
  })),
)

const StringLogAtom = Atom.make(MIDIDeviceConnectionEventsStringLog).pipe(
  Atom.keepAlive,
  Atom.withServerValueInitial,
)

export const ConnectionEventsLog = () => {
  const text = Hooks.useAtomValue(StringLogAtom)

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
