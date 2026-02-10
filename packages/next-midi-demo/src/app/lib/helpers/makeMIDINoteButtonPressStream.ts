import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import * as Parsing from 'effect-web-midi/Parsing'

import * as Predicate from 'effect/Predicate'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../branded/index.ts'
import * as MIDIValues from '../branded/MIDIValues.ts'
import { SelectedMIDIInputService } from '../services/SelectedMIDIInputService.ts'

export const makeMIDINoteButtonPressStream = (
  notesToFocusOn: Set<MIDIValues.NoteId>,
) =>
  SelectedMIDIInputService.changes.pipe(
    Stream.unwrap,
    Stream.flatMap(inputId =>
      inputId ? EMIDIInput.makeMessagesStreamById(inputId) : Stream.empty,
    ),
    Stream.catchTag('PortNotFound', () =>
      Stream.dieMessage('it should not be possible to pass invalid id'),
    ),
    Parsing.withParsedDataField,
    Stream.filter(
      Predicate.compose(
        Predicate.or(Parsing.isNoteRelease, Parsing.isNotePress),
        _ => notesToFocusOn.has(_.midiMessage.note as MIDIValues.NoteId),
      ),
    ),
    Stream.map(
      ({ midiMessage: { _tag, note } }) =>
        [
          new MIDIValues.NoteIdData(note),
          _tag === 'Note Press' ? ButtonState.Pressed : ButtonState.NotPressed,
        ] as const,
    ),
  )
