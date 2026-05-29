import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import {
  AccordIndexData,
  AccordParamButtonData,
} from '../brandsAndDatas/Accord.ts'
import { KeyboardKeyPhysicalButtonData } from '../brandsAndDatas/KeyboardKey.ts'
import { NotePhysicalButtonData } from '../brandsAndDatas/MIDIValues.ts'
import {
  PatternIndexData,
  PatternParamButtonData,
} from '../brandsAndDatas/Pattern.ts'
import {
  PhysicalButtonId,
  PhysicalButtonIdData,
} from '../brandsAndDatas/PhysicalButton.ts'
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

const makeVirtualParamStream = <const Key extends string, Data>(
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
      return [makeData(val), state] as const
    },
  )

// Keyboard - Accord
const keyboardAccordKeys = 'qwertyuiйцукенгш'
const keyDatasHandlingAccords = makePhysicalKeyDatas(keyboardAccordKeys)
const keysHandlingAccordsSet = new Set(
  keyDatasHandlingAccords.map(data => data.id.key),
)

// Keyboard - Pattern
const keyboardPatternKeys = '12345678'
const keyDatasHandlingPatterns = makePhysicalKeyDatas(keyboardPatternKeys)
const keysHandlingPatternsSet = new Set(
  keyDatasHandlingAccords.map(data => data.id.key),
)

// Keyboard - Strength
const keyboardStrengthKeys = 'asdфыв'
const keyDatasHandlingStrengths = makePhysicalKeyDatas(keyboardStrengthKeys)
const keysHandlingStrengthsSet = new Set(
  keyDatasHandlingAccords.map(data => data.id.key),
)

// MIDI - Accord
const midiAccordNotes = EArray.range(84, 91)
const noteDatasHandlingAccords = makePhysicalNoteDatas(midiAccordNotes)
const notesHandlingAccordsSet = new Set(
  noteDatasHandlingAccords.map(data => data.id.note),
)

// MIDI - Pattern
const midiPatternNotes = EArray.range(92, 99)
const noteDatasHandlingPatterns = makePhysicalNoteDatas(midiPatternNotes)
const notesHandlingPatternsSet = new Set(
  noteDatasHandlingPatterns.map(data => data.id.note),
)

// MIDI - Strength
const midiStrengthNotes = EArray.range(76, 78)
const noteDatasHandlingStrengths = makePhysicalNoteDatas(midiStrengthNotes)
const notesHandlingStrengthsSet = new Set(
  noteDatasHandlingStrengths.map(data => data.id.note),
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
        keyDatasHandlingAccords,
        [...accords, ...accords],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingAccordsSet),
        AccordInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        keyDatasHandlingPatterns,
        // patterns are bound to number keys which produce the same signals
        // across layout switches
        patterns,
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingPatternsSet),
        PatternInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        keyDatasHandlingStrengths,
        [...strengths, ...strengths],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingStrengthsSet),
        StrengthInputBus,
      ),

      // MIDI Pad

      // TODO: midi device selector
      assignPhysicalButtonGroupToRespectiveParamButtons(
        noteDatasHandlingAccords,
        accords,
        makeMIDINoteButtonPressStream(notesHandlingAccordsSet),
        AccordInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        noteDatasHandlingPatterns,
        patterns,
        makeMIDINoteButtonPressStream(notesHandlingPatternsSet),
        PatternInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        noteDatasHandlingStrengths,
        strengths,
        makeMIDINoteButtonPressStream(notesHandlingStrengthsSet),
        StrengthInputBus,
      ),

      // On screen buttons

      assignPhysicalButtonGroupToRespectiveParamButtons(
        accords.map(accord =>
          PhysicalButtonId(new AccordIndexData(accord.index)),
        ),
        accords,
        makeVirtualParamStream('accordIndex', s =>
          AccordIndexData.makeUnsafe(parseInt(s, 10)),
        ),
        AccordInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        patterns.map(pattern =>
          PhysicalButtonId(new PatternIndexData(pattern.index)),
        ),
        patterns,
        makeVirtualParamStream('patternIndex', s =>
          PatternIndexData.makeUnsafe(parseInt(s, 10)),
        ),
        PatternInputBus,
      ),
      assignPhysicalButtonGroupToRespectiveParamButtons(
        strengths.map(strength => PhysicalButtonId(new StrengthData(strength))),
        strengths,
        makeVirtualParamStream('strength', s => new StrengthData(s)),
        StrengthInputBus,
      ),
    ],
    { discard: true, concurrency: 'unbounded' },
  )
}).pipe(Layer.scopedDiscard)
