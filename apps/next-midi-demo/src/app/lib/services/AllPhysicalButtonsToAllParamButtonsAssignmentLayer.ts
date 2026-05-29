import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import {
  AccordIndexData,
  AccordParamButtonData,
} from '../brandsAndDatas/Accord.ts'
import { DOMPhysicalButtonData } from '../brandsAndDatas/DOMButton.ts'
import { KeyboardKeyPhysicalButtonData } from '../brandsAndDatas/KeyboardKey.ts'
import { NotePhysicalButtonData } from '../brandsAndDatas/MIDIValues.ts'
import {
  PatternIndexData,
  PatternParamButtonData,
} from '../brandsAndDatas/Pattern.ts'
import {
  type Strength,
  StrengthData,
  StrengthParamButtonData,
} from '../brandsAndDatas/Strength.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { makeVirtualButtonTouchStateStream } from '../helpers/makeVirtualButtonTouchStateStream.ts'
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

const makeVirtualParamStream = <
  const Key extends string,
  Data extends PatternIndexData | AccordIndexData | StrengthData,
>(
  key: Key,
  makeData: (value: string) => Data,
) =>
  Stream.map(
    makeVirtualButtonTouchStateStream(new Set([key] as const)),
    ([element, state]) => {
      const val = element[key]
      if (!val)
        throw new Error(
          "makeVirtualParamStream can't find proper dataset field in DOM element",
        )
      return [new DOMPhysicalButtonData(makeData(val)), state] as const
    },
  )

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

// TODO: make TParamButton a ParamButtonData

export const AllButtonMappingLayer = Effect.gen(function* () {
  const params = yield* Effect.all([
    AccordRegistry.allAccords,
    PatternRegistry.allPatterns,
    StrengthRegistry.allStrengths,
  ])

  const [accords, patterns, strengths] = [
    params[0].map(a => AccordParamButtonData.make(a.index)),
    params[1].map(p => PatternParamButtonData.make(p.index)),
    // TODO: make upstream properly branded
    params[2].map(s => StrengthParamButtonData.make(s as Strength)),
  ]

  yield* Effect.all(
    [
      // Keyboard

      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalKeyIdsHandlingAccords,
        [...accords, ...accords],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingAccordsSet),
        AccordInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalKeyIdsHandlingPatterns,
        // patterns are bound to number keys which produce the same signals
        // across layout switches
        patterns,
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingPatternsSet),
        PatternInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalKeyIdsHandlingStrengths,
        [...strengths, ...strengths],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingStrengthsSet),
        StrengthInputBus,
      ),

      // MIDI Pad

      // TODO: midi device selector
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalNoteIdsHandlingAccords,
        accords,
        makeMIDINoteButtonPressStream(notesHandlingAccordsSet),
        AccordInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalNoteIdsHandlingPatterns,
        patterns,
        makeMIDINoteButtonPressStream(notesHandlingPatternsSet),
        PatternInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        physicalNoteIdsHandlingStrengths,
        strengths,
        makeMIDINoteButtonPressStream(notesHandlingStrengthsSet),
        StrengthInputBus,
      ),

      // On screen buttons

      assignPhysicalButtonGroupToRespectiveParamButtons(
        accords.map(paramButton => new DOMPhysicalButtonData(paramButton.id)),
        accords,
        makeVirtualParamStream('accordIndex', datasetFieldValue =>
          AccordIndexData.makeUnsafe(parseInt(datasetFieldValue, 10)),
        ),
        AccordInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        patterns.map(paramButton => new DOMPhysicalButtonData(paramButton.id)),
        patterns,
        makeVirtualParamStream('patternIndex', datasetFieldValue =>
          PatternIndexData.makeUnsafe(parseInt(datasetFieldValue, 10)),
        ),
        PatternInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        strengths.map(paramButton => new DOMPhysicalButtonData(paramButton.id)),
        strengths,
        makeVirtualParamStream('strength', StrengthData.makeUnsafe),
        StrengthInputBus,
      ),
    ],
    { discard: true, concurrency: 'unbounded' },
  )
}).pipe(Layer.scopedDiscard)
