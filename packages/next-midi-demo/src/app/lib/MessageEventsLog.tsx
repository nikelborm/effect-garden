/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'
import { Atom, Result, useAtomValue } from '@effect-atom/atom-react'
import * as Cause from 'effect/Cause'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Predicate from 'effect/Predicate'
import * as Record from 'effect/Record'
import * as Stream from 'effect/Stream'
import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import * as EMIDIPort from 'effect-web-midi/EMIDIPort'
import * as Parsing from 'effect-web-midi/Parsing'
import * as Util from 'effect-web-midi/Util'
import { launchpadInputMIDI } from './ports.ts'

const MIDIMessageEventsStringLog = pipe(
  EMIDIInput.makeMessagesStreamById(launchpadInputMIDI, {}),
  Parsing.withParsedDataField,
  Parsing.withTouchpadPositionUpdates,
  Stream.filter(Predicate.or(Parsing.isChannelPressure, Parsing.isNotePress)),
  Util.mapToGlidingStringLogOfLimitedEntriesCount(
    50,
    'latestFirst',
    current => ({
      time: current.capturedAt.toISOString(),
      id: current.cameFrom.id.slice(-10),
      ...current.midiMessage,
    }),
  ),
  Stream.catchTag('PortNotFound', err =>
    Stream.fromEffect(
      EMIDIPort.FullRecord.pipe(
        Effect.map(
          Record.reduce(
            `Port with id=${err.portId} is not found. Currently available ports: \n`,
            (acc, { type, version, name }, id) =>
              acc + type.padEnd(7) + id + ' ' + version + ' ' + name + '\n',
          ),
        ),
        Effect.flatMap(Console.log),
        Effect.andThen(
          `KORG nanoPAD not found in the list of connected devices`,
        ),
      ),
    ),
  ),
  Stream.provideLayer(
    EMIDIAccess.layerSystemExclusiveAndSoftwareSynthSupported,
  ),
  Stream.catchTag('MIDIAccessNotSupportedError', e =>
    Stream.succeed(e.cause.message),
  ),
)

const StringLogAtom = Atom.make(MIDIMessageEventsStringLog)

export const MessageEventsLog = () => {
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
        No message events happened yet. initial waiting: {e.waiting.toString()}
      </pre>
    ),
    onSuccess: s => <pre>{s.value}</pre>,
  })
}
