import type { EMIDIAccess } from 'effect-web-midi'
import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import * as Parsing from 'effect-web-midi/Parsing'

import * as Data from 'effect/Data'
import * as Predicate from 'effect/Predicate'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../brandsAndDatas/index.ts'
import {
  type NoteId,
  NotePhysicalButtonData,
} from '../brandsAndDatas/MIDIValues.ts'
import { SelectedMIDIInputService } from '../services/SelectedMIDIInputService.ts'

export const makeMIDINoteButtonPressStream = (
  notesToFocusOn: Set<NoteId>,
): Stream.Stream<
  readonly [NotePhysicalButtonData, ButtonState.AllSimple],
  never,
  EMIDIAccess.EMIDIAccess | SelectedMIDIInputService
> =>
  SelectedMIDIInputService.changes.pipe(
    Stream.unwrap,
    Stream.flatMap(
      inputId =>
        inputId ? EMIDIInput.makeMessagesStreamById(inputId) : Stream.empty,
      { switch: true, concurrency: 1 },
    ),
    Stream.catchTag('PortNotFound', () =>
      Stream.dieMessage('it should not be possible to pass invalid id'),
    ),
    Parsing.withParsedDataField,
    Stream.filter(
      Predicate.compose(
        Predicate.or(Parsing.isNoteRelease, Parsing.isNotePress),
        _ => notesToFocusOn.has(_.midiMessage.note as NoteId),
      ),
    ),
    Stream.map(({ midiMessage: { _tag, note } }) =>
      Data.tuple(
        NotePhysicalButtonData.makeUnsafe(note),
        _tag === 'Note Press' ? ButtonState.Pressed : ButtonState.NotPressed,
      ),
    ),
  )
