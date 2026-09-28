'use client'

import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import type * as MIDIErrors from 'effect-web-midi/MIDIErrors'
import * as Parsing from 'effect-web-midi/Parsing'
import * as Util from 'effect-web-midi/Util'

import type * as Cause from 'effect/Cause'
import { pipe } from 'effect/Function'
import * as AsyncResult from 'effect/reactivity/AsyncResult'
// import { Atom, Result } from '@effect-atom/atom-react'
import * as Atom from 'effect/reactivity/Atom'
import * as Stream from 'effect/Stream'

export const getMessagesLogAtom: (
  inputId: EMIDIInput.Id | null,
) => Atom.Atom<
  AsyncResult.AsyncResult<
    string,
    | MIDIErrors.AbortError
    | MIDIErrors.UnderlyingSystemError
    | MIDIErrors.MIDIAccessNotAllowedError
    | MIDIErrors.PortNotFoundError
    | Cause.NoSuchElementError
  >
> = Atom.family(inputId =>
  !inputId
    ? Atom.make(
        AsyncResult.success('Input id is not selected. No log entries to show'),
      ).pipe(Atom.withLabel('messagesStringLog'))
    : pipe(
        EMIDIInput.makeMessagesStreamById(inputId),
        Parsing.withParsedDataField,
        Parsing.withTouchpadPositionUpdates,
        Util.mapToGlidingStringLogOfLimitedEntriesCount(
          50,
          'latestFirst',
          current => ({
            time: current.capturedAt.toISOString(),
            id: current.cameFrom.id.slice(-10),
            ...current.midiMessage,
          }),
        ),
        Stream.provide(
          EMIDIAccess.layerSystemExclusiveAndSoftwareSynthSupported,
        ),
        Stream.catchTag('MIDIAccessNotSupportedError', e =>
          Stream.succeed(e.cause.message),
        ),
        messageEventLogStream => Atom.make(messageEventLogStream),
        Atom.withLabel('messagesStringLog'),
        Atom.keepAlive,
        Atom.withServerValueInitial,
      ),
)
