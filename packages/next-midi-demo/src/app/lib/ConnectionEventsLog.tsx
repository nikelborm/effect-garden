/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'
import { Atom, Result, useAtomValue } from '@effect-atom/atom-react'
import * as Cause from 'effect/Cause'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import { flow, pipe } from 'effect/Function'
import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as Util from 'effect-web-midi/Util'

const MIDIDeviceConnectionEventsStringLog = pipe(
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
  const text = useAtomValue(StringLogAtom)

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
