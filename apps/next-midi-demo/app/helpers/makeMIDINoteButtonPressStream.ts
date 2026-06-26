import { EMIDIAccess } from 'effect-web-midi'
import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import * as Parsing from 'effect-web-midi/Parsing'

import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Predicate from 'effect/Predicate'
import * as Stream from 'effect/Stream'

import * as ButtonState from '../domain/ButtonState.ts'
import { type NoteId, NotePhysicalButtonData } from '../domain/MIDIValues.ts'
import { SelectedMIDIInputService } from '../services/SelectedMIDIInputService.ts'

Effect.serviceOption

export const makeMIDINoteButtonPressStream = (
  notesToFocusOn: Set<NoteId>,
): Stream.Stream<
  readonly [NotePhysicalButtonData, ButtonState.AllSimple],
  never,
  SelectedMIDIInputService
> =>
  Effect.gen(function* () {
    const accessOption = yield* Effect.serviceOption(EMIDIAccess.EMIDIAccess)
    if (Option.isNone(accessOption)) return Stream.empty

    const selectedMIDIInputService = yield* SelectedMIDIInputService

    return Stream.flatMap(
      selectedMIDIInputService.changes,
      inputId =>
        inputId
          ? accessOption.value.pipe(
              EMIDIAccess.getInputByIdInPipe(inputId),
              Effect.catchTag('PortNotFound', () =>
                Effect.dieMessage(
                  'Assertion failed. Got nonexistent id from SelectedMIDIInputService.changes',
                ),
              ),
              EMIDIInput.makeMessagesStream(),
            )
          : Stream.empty,
      { switch: true, concurrency: 1 },
    )
  }).pipe(
    Stream.unwrap,
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
