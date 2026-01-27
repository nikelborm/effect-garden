'use client'

import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as Util from 'effect-web-midi/Util'

import * as Atom from '@effect-atom/atom/Atom'
import * as EFunction from 'effect/Function'

const MIDIDeviceConnectionEventsStringLogStream = EFunction.pipe(
  EMIDIAccess.request(),
  EMIDIAccess.makeAllPortsStateChangesStream(),
  Util.mapToGlidingStringLogOfLimitedEntriesCount(50, 'latestFirst', _ => ({
    time: _.capturedAt.toISOString(),
    id: _.port.id.slice(-10),
    device: _.newState.ofDevice.padStart(12),
    connection: _.newState.ofConnection.padStart(7),
  })),
)

export const MIDIDeviceConnectionEventsStringLogAtom = Atom.make(
  MIDIDeviceConnectionEventsStringLogStream,
).pipe(Atom.keepAlive, Atom.withServerValueInitial)
