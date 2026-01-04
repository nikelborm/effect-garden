/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'
import { Atom, Result, useAtomValue } from '@effect-atom/atom-react'
import * as Cause from 'effect/Cause'
import { pipe } from 'effect/Function'
import * as Predicate from 'effect/Predicate'
import * as Stream from 'effect/Stream'
import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import * as Parsing from 'effect-web-midi/Parsing'
import * as Util from 'effect-web-midi/Util'
import { readonlySelectedIdAtom } from './MIDIDeviceSelect.tsx'

const makeStringLogAtom = Atom.family((inputId: EMIDIInput.Id | null) =>
  !inputId
    ? Atom.make(Result.success('empty'))
    : pipe(
        EMIDIInput.makeMessagesStreamById(inputId),
        Parsing.withParsedDataField,
        Parsing.withTouchpadPositionUpdates,
        Stream.filter(
          Predicate.or(Parsing.isChannelPressure, Parsing.isNotePress),
        ),
        Util.mapToGlidingStringLogOfLimitedEntriesCount(
          50,
          'latestFirst',
          current => ({
            time: current.capturedAt.toISOString(),
            id: current.cameFrom.id.slice(-10),
            ...current.midiMessage,
          }),
        ),
        Stream.provideLayer(
          EMIDIAccess.layerSystemExclusiveAndSoftwareSynthSupported,
        ),
        Stream.catchTag('MIDIAccessNotSupportedError', e =>
          Stream.succeed(e.cause.message),
        ),
        messageEventLogStream => Atom.make(messageEventLogStream),
        Atom.keepAlive,
        Atom.withServerValueInitial,
      ),
)

export const MessageEventsLog = () => {
  const selectedId = useAtomValue(readonlySelectedIdAtom)
  const text = useAtomValue(makeStringLogAtom(selectedId))

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
