import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import type * as MIDIErrors from 'effect-web-midi/MIDIErrors'
import * as Parsing from 'effect-web-midi/Parsing'

import * as Atom from '@effect-atom/atom/Atom'
import type * as Result from '@effect-atom/atom/Result'
import { pipe } from 'effect/Function'
import * as Predicate from 'effect/Predicate'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../branded/index.ts'
import * as MIDIValues from '../branded/MIDIValues.ts'
import { setPhysicalMIDIPadButtonState } from '../state/PhysicalMIDIDeviceNoteToVirtualMIDIPadButtonMap.ts'

export const getNotePressReleaseEventsAtom: (
  arg: EMIDIInput.Id | null,
) => Atom.Atom<
  Result.Result<
    Parsing.ParsedMIDIMessage<
      Parsing.NotePressPayload | Parsing.NoteReleasePayload
    >,
    | MIDIErrors.AbortError
    | MIDIErrors.MIDIAccessNotAllowedError
    | MIDIErrors.MIDIAccessNotSupportedError
    | MIDIErrors.UnderlyingSystemError
  >
> = Atom.family((inputId: EMIDIInput.Id | null) =>
  !inputId
    ? Atom.make(Stream.empty).pipe(Atom.withLabel('notePressReleaseEvents'))
    : pipe(
        EMIDIInput.makeMessagesStreamById(inputId),
        Stream.catchTag('PortNotFound', () =>
          Stream.dieMessage('it should not be possible to pass invalid id'),
        ),
        Parsing.withParsedDataField,
        Parsing.withTouchpadPositionUpdates,
        Stream.filter(Predicate.or(Parsing.isNoteRelease, Parsing.isNotePress)),
        Stream.provideLayer(
          EMIDIAccess.layerSystemExclusiveAndSoftwareSynthSupported,
        ),
        Stream.tap(({ midiMessage }) =>
          Atom.set(setPhysicalMIDIPadButtonState, {
            midiPadPress:
              midiMessage._tag === 'Note Press'
                ? ButtonState.Pressed
                : ButtonState.NotPressed,
            physicalMIDIDeviceNote: MIDIValues.NoteId(midiMessage.note),
          }),
        ),
        messageEventLogStream => Atom.make(messageEventLogStream),
        Atom.withLabel('notePressReleaseEvents'),
        Atom.keepAlive,
        Atom.withServerValueInitial,
      ),
)
