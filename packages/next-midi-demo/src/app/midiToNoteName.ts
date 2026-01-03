import * as Either from 'effect/Either'
import * as Schema from 'effect/Schema'

const MIDDLE_C_OCTAVE = 5 // Change to 3 or 5 based on preference

/**
 * Maps a MIDI note number to its corresponding musical note name and octave.
 * @param midiNoteIndex MIDI note number (0-127)
 * @returns String representation (e.g., "C4", "F#2")
 */
export function midiToNoteName(
  midiNoteIndex: number,
): Either.Either<string, InvalidMIDINote> {
  if (
    !Number.isSafeInteger(midiNoteIndex) ||
    midiNoteIndex < 0 ||
    midiNoteIndex > 127
  )
    return Either.left(new InvalidMIDINote())

  const noteNames = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ]

  // Calculate the note index (0-11)
  const noteIndex = midiNoteIndex % 12

  // Calculate the octave (-1 to 9)
  const octave = Math.floor(midiNoteIndex / 12) - (5 - MIDDLE_C_OCTAVE)

  return Either.right(`${noteNames[noteIndex]}${octave}`)
}

export class InvalidMIDINote extends Schema.TaggedError<InvalidMIDINote>()(
  'InvalidMIDINote',
  {},
) {
  override message = 'MIDI note must be between 0 and 127'
}
