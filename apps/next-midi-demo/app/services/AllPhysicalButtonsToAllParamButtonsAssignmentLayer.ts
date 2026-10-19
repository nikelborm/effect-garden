import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { AllChords, ChordData, ChordParamButtonData } from '../domain/Chord.ts'
import { DOMPhysicalButtonData } from '../domain/DOMButton.ts'
import { KeyboardKeyPhysicalButtonData } from '../domain/KeyboardKey.ts'
import { NotePhysicalButtonData } from '../domain/MIDIValues.ts'
import {
  AllPatterns,
  PatternData,
  PatternParamButtonData,
} from '../domain/Pattern.ts'
import {
  AllStrengths,
  StrengthData,
  StrengthParamButtonData,
} from '../domain/Strength.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { makeParamButtonTouchStateStream } from '../helpers/makeParamButtonTouchStateStream.ts'
import { assignPhysicalButtonGroupToRespectiveParamButtons } from './assignPhysicalButtonGroupToRespectiveParamButtons.ts'
import {
  ChordInputBus,
  PatternInputBus,
  StrengthInputBus,
} from './InputStreamBus.ts'

const makePhysicalNoteDatas = (notes: Iterable<number>) =>
  Array.from(
    notes,
    NotePhysicalButtonData.makeUnsafe,
  ) as unknown as EArray.NonEmptyReadonlyArray<NotePhysicalButtonData>

const makePhysicalKeyDatas = (keys: Iterable<string>) =>
  Array.from(
    keys,
    KeyboardKeyPhysicalButtonData.makeUnsafe,
  ) as unknown as EArray.NonEmptyReadonlyArray<KeyboardKeyPhysicalButtonData>

// Keyboard - Chord
const keyboardChordKeys = 'qwertyuiйцукенгш'
const physicalKeyIdsHandlingChords = makePhysicalKeyDatas(keyboardChordKeys)
const keysHandlingChordsSet = new Set(
  physicalKeyIdsHandlingChords.map(data => data.id.key),
)

// Keyboard - Pattern
const keyboardPatternKeys = '12345678'
const physicalKeyIdsHandlingPatterns = makePhysicalKeyDatas(keyboardPatternKeys)
const keysHandlingPatternsSet = new Set(
  physicalKeyIdsHandlingPatterns.map(data => data.id.key),
)

// Keyboard - Strength
const keyboardStrengthKeys = 'asdфыв'
const physicalKeyIdsHandlingStrengths =
  makePhysicalKeyDatas(keyboardStrengthKeys)
const keysHandlingStrengthsSet = new Set(
  physicalKeyIdsHandlingStrengths.map(data => data.id.key),
)

// MIDI - Chord
const midiChordNotes = EArray.range(84, 91)
const physicalNoteIdsHandlingChords = makePhysicalNoteDatas(midiChordNotes)
const notesHandlingChordsSet = new Set(
  physicalNoteIdsHandlingChords.map(data => data.id.note),
)

// MIDI - Pattern
const midiPatternNotes = EArray.range(92, 99)
const physicalNoteIdsHandlingPatterns = makePhysicalNoteDatas(midiPatternNotes)
const notesHandlingPatternsSet = new Set(
  physicalNoteIdsHandlingPatterns.map(data => data.id.note),
)

// MIDI - Strength
const midiStrengthNotes = EArray.range(76, 78)
const physicalNoteIdsHandlingStrengths =
  makePhysicalNoteDatas(midiStrengthNotes)
const notesHandlingStrengthsSet = new Set(
  physicalNoteIdsHandlingStrengths.map(data => data.id.note),
)

const paramButtonIds = Effect.all({
  AllChords,
  AllPatterns,
  AllStrengths,
}).pipe(
  Effect.map(
    _ =>
      ({
        chordParamButtonIds: EArray.map(_.AllChords, ChordParamButtonData.make),
        patternParamButtonIds: EArray.map(
          _.AllPatterns,
          PatternParamButtonData.make,
        ),
        strengthParamButtonIds: EArray.map(
          _.AllStrengths,
          StrengthParamButtonData.make,
        ),
      }) as const,
  ),
  Effect.cached,
  Effect.flatten,
)

export const KeyboardButtonMappingLayer = Effect.gen(function* () {
  const { chordParamButtonIds, patternParamButtonIds, strengthParamButtonIds } =
    yield* paramButtonIds

  yield* Effect.all(
    [
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalKeyIdsHandlingChords,
        [...chordParamButtonIds, ...chordParamButtonIds],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingChordsSet),
        ChordInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalKeyIdsHandlingPatterns,
        // patterns are bound to number keys which produce the same signals
        // across layout switches
        patternParamButtonIds,
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingPatternsSet),
        PatternInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalKeyIdsHandlingStrengths,
        [...strengthParamButtonIds, ...strengthParamButtonIds],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingStrengthsSet),
        StrengthInputBus,
      ),
    ],
    { discard: true, concurrency: 'unbounded' },
  ).pipe(Effect.forkScoped)
}).pipe(Effect.withSpan('KeyboardButtonMappingLayer.init'), Layer.effectDiscard)

export const MIDIPadButtonMappingLayer = Effect.gen(function* () {
  const { chordParamButtonIds, patternParamButtonIds, strengthParamButtonIds } =
    yield* paramButtonIds

  yield* Effect.all(
    [
      // TODO: midi device selector
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalNoteIdsHandlingChords,
        chordParamButtonIds,
        makeMIDINoteButtonPressStream(notesHandlingChordsSet),
        ChordInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalNoteIdsHandlingPatterns,
        patternParamButtonIds,
        makeMIDINoteButtonPressStream(notesHandlingPatternsSet),
        PatternInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalNoteIdsHandlingStrengths,
        strengthParamButtonIds,
        makeMIDINoteButtonPressStream(notesHandlingStrengthsSet),
        StrengthInputBus,
      ),
    ],
    { discard: true, concurrency: 'unbounded' },
  ).pipe(Effect.forkScoped)
}).pipe(Effect.withSpan('MIDIPadButtonMappingLayer.init'), Layer.effectDiscard)

export const OnScreenButtonMappingLayer = Effect.gen(function* () {
  const { chordParamButtonIds, patternParamButtonIds, strengthParamButtonIds } =
    yield* paramButtonIds

  yield* Effect.all(
    [
      // Since UI button ids are assigned manually, there's no better candidate
      // for their ids, than the entities they represent

      assignPhysicalButtonGroupToRespectiveParamButtons(
        EArray.map(
          chordParamButtonIds,
          DOMPhysicalButtonData.makeFromParamButton,
        ),
        chordParamButtonIds,
        makeParamButtonTouchStateStream('chord', ChordData.makeUnsafe),
        ChordInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        EArray.map(
          patternParamButtonIds,
          DOMPhysicalButtonData.makeFromParamButton,
        ),
        patternParamButtonIds,
        makeParamButtonTouchStateStream('pattern', PatternData.makeUnsafe),
        PatternInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        EArray.map(
          strengthParamButtonIds,
          DOMPhysicalButtonData.makeFromParamButton,
        ),
        strengthParamButtonIds,
        makeParamButtonTouchStateStream('strength', StrengthData.makeUnsafe),
        StrengthInputBus,
      ),
    ],
    { discard: true, concurrency: 'unbounded' },
  ).pipe(Effect.forkScoped)
}).pipe(Effect.withSpan('OnScreenButtonMappingLayer.init'), Layer.effectDiscard)
