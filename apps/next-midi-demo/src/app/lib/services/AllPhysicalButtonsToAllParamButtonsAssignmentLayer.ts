import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { AccordData, AccordParamButtonData } from '../brandsAndDatas/Accord.ts'
import { DOMPhysicalButtonData } from '../brandsAndDatas/DOMButton.ts'
import { KeyboardKeyPhysicalButtonData } from '../brandsAndDatas/KeyboardKey.ts'
import { NotePhysicalButtonData } from '../brandsAndDatas/MIDIValues.ts'
import {
  PatternData,
  PatternParamButtonData,
} from '../brandsAndDatas/Pattern.ts'
import {
  StrengthData,
  StrengthParamButtonData,
} from '../brandsAndDatas/Strength.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { makeParamButtonTouchStateStream } from '../helpers/makeParamButtonTouchStateStream.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { assignPhysicalButtonGroupToRespectiveParamButtons } from './assignPhysicalButtonGroupToRespectiveParamButtons.ts'
import {
  AccordInputBus,
  PatternInputBus,
  StrengthInputBus,
} from './InputStreamBus.ts'
import { PatternRegistry } from './PatternRegistry.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

const makePhysicalNoteDatas = (notes: Iterable<number>) =>
  Array.from(notes, NotePhysicalButtonData.makeUnsafe)

const makePhysicalKeyDatas = (keys: Iterable<string>) =>
  Array.from(keys, KeyboardKeyPhysicalButtonData.makeUnsafe)

// Keyboard - Accord
const keyboardAccordKeys = 'qwertyuiйцукенгш'
const physicalKeyIdsHandlingAccords = makePhysicalKeyDatas(keyboardAccordKeys)
const keysHandlingAccordsSet = new Set(
  physicalKeyIdsHandlingAccords.map(data => data.id.key),
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

// MIDI - Accord
const midiAccordNotes = EArray.range(84, 91)
const physicalNoteIdsHandlingAccords = makePhysicalNoteDatas(midiAccordNotes)
const notesHandlingAccordsSet = new Set(
  physicalNoteIdsHandlingAccords.map(data => data.id.note),
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

export const AllButtonMappingLayer = Effect.gen(function* () {
  const params = yield* Effect.all([
    AccordRegistry.allAccords,
    PatternRegistry.allPatterns,
    StrengthRegistry.allStrengths,
  ])

  const [accordParamButtonIds, patternParamButtonIds, strengthParamButtonIds] =
    [
      params[0].map(AccordParamButtonData.make),
      params[1].map(PatternParamButtonData.make),
      params[2].map(StrengthParamButtonData.make),
    ]

  yield* Effect.all(
    [
      // Keyboard

      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalKeyIdsHandlingAccords,
        [...accordParamButtonIds, ...accordParamButtonIds],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingAccordsSet),
        AccordInputBus,
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

      // MIDI Pad

      // TODO: midi device selector
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalNoteIdsHandlingAccords,
        accordParamButtonIds,
        makeMIDINoteButtonPressStream(notesHandlingAccordsSet),
        AccordInputBus,
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

      // On screen buttons

      // Since UI button ids are assigned manually, there's no better candidate
      // for their ids, than the entities they represent

      assignPhysicalButtonGroupToRespectiveParamButtons(
        accordParamButtonIds.map(DOMPhysicalButtonData.makeFromParamButton),
        accordParamButtonIds,
        makeParamButtonTouchStateStream('accord', AccordData.makeUnsafe),
        AccordInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        patternParamButtonIds.map(DOMPhysicalButtonData.makeFromParamButton),
        patternParamButtonIds,
        makeParamButtonTouchStateStream('pattern', PatternData.makeUnsafe),
        PatternInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        strengthParamButtonIds.map(DOMPhysicalButtonData.makeFromParamButton),
        strengthParamButtonIds,
        makeParamButtonTouchStateStream('strength', StrengthData.makeUnsafe),
        StrengthInputBus,
      ),
    ],
    { discard: true, concurrency: 'unbounded' },
  )
}).pipe(Layer.scopedDiscard)
