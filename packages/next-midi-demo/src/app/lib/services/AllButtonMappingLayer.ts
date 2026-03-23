import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import type {
  RecordedAccordIndexes,
  RecordedPatternIndexes,
} from '../audioAssetHelpers.ts'
import * as MIDIValues from '../branded/MIDIValues.ts'
import { ValidKeyboardKeyData } from '../branded/StoreValues.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { makeVirtualButtonTouchStateStream } from '../helpers/makeVirtualButtonTouchStateStream.ts'
import { AccordIndexData, AccordRegistry } from './AccordRegistry.ts'
import {
  AccordInputBus,
  PatternInputBus,
  StrengthInputBus,
} from './InputStreamBus.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { PatternIndexData, PatternRegistry } from './PatternRegistry.ts'
import { StrengthData, StrengthRegistry } from './StrengthRegistry.ts'

const toValueSet = <V>(datas: readonly { readonly value: V }[]) =>
  new Set(datas.map(_ => _.value))

const makeNoteDatas = (notes: Iterable<number>) =>
  Array.from(notes, note => new MIDIValues.NoteIdData(note))

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
const keyDatasHandlingAccords = Array.from(
  keyboardAccordKeys,
  key => new ValidKeyboardKeyData(key),
)
const keysHandlingAccordsSet = toValueSet(keyDatasHandlingAccords)

// Keyboard - Pattern
const keyboardPatternKeys = '12345678'
const keyDatasHandlingPatterns = Array.from(
  keyboardPatternKeys,
  key => new ValidKeyboardKeyData(key),
)
const keysHandlingPatternsSet = toValueSet(keyDatasHandlingPatterns)

// Keyboard - Strength
const keyboardStrengthKeys = 'asdфыв'
const keyDatasHandlingStrengths = Array.from(
  keyboardStrengthKeys,
  key => new ValidKeyboardKeyData(key),
)
const keysHandlingStrengthsSet = toValueSet(keyDatasHandlingStrengths)

// MIDI - Accord
const midiAccordNotes = EArray.range(84, 91)
const noteDatasHandlingAccords = makeNoteDatas(midiAccordNotes)
const notesHandlingAccordsSet = toValueSet(noteDatasHandlingAccords)

// MIDI - Pattern
const midiPatternNotes = EArray.range(92, 99)
const noteDatasHandlingPatterns = makeNoteDatas(midiPatternNotes)
const notesHandlingPatternsSet = toValueSet(noteDatasHandlingPatterns)

// MIDI - Strength
const midiStrengthNotes = EArray.range(76, 78)
const noteDatasHandlingStrengths = makeNoteDatas(midiStrengthNotes)
const notesHandlingStrengthsSet = toValueSet(noteDatasHandlingStrengths)

export const AllButtonMappingLayer = Effect.gen(function* () {
  const [accords, patterns, strengths] = yield* Effect.all([
    AccordRegistry.allAccords,
    PatternRegistry.allPatterns,
    StrengthRegistry.allStrengths,
  ])

  yield* Effect.all([
    makePhysicalButtonToParamMappingService(
      keyDatasHandlingAccords,
      [...accords, ...accords],
      makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingAccordsSet),
      AccordInputBus,
    ),
    makePhysicalButtonToParamMappingService(
      keyDatasHandlingPatterns,
      patterns,
      makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingPatternsSet),
      PatternInputBus,
    ),
    makePhysicalButtonToParamMappingService(
      keyDatasHandlingStrengths,
      [...strengths, ...strengths],
      makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingStrengthsSet),
      StrengthInputBus,
    ),
    // TODO: midi device selector
    makePhysicalButtonToParamMappingService(
      noteDatasHandlingAccords,
      accords,
      makeMIDINoteButtonPressStream(notesHandlingAccordsSet),
      AccordInputBus,
    ),
    makePhysicalButtonToParamMappingService(
      noteDatasHandlingPatterns,
      patterns,
      makeMIDINoteButtonPressStream(notesHandlingPatternsSet),
      PatternInputBus,
    ),
    makePhysicalButtonToParamMappingService(
      noteDatasHandlingStrengths,
      strengths,
      makeMIDINoteButtonPressStream(notesHandlingStrengthsSet),
      StrengthInputBus,
    ),
    makePhysicalButtonToParamMappingService(
      accords.map(
        accord =>
          new AccordIndexData(
            accord.index,
          ) as unknown as AccordIndexData<RecordedAccordIndexes>,
      ),
      accords,
      makeVirtualParamStream(
        'accordIndex',
        s => new AccordIndexData(parseInt(s, 10)),
      ),
      AccordInputBus,
    ),
    makePhysicalButtonToParamMappingService(
      patterns.map(
        pattern =>
          new PatternIndexData(
            pattern.index,
          ) as unknown as PatternIndexData<RecordedPatternIndexes>,
      ),
      patterns,
      makeVirtualParamStream(
        'patternIndex',
        s => new PatternIndexData(parseInt(s, 10)),
      ),
      PatternInputBus,
    ),
    makePhysicalButtonToParamMappingService(
      strengths.map(strength => new StrengthData(strength)),
      strengths,
      makeVirtualParamStream('strength', s => new StrengthData(s)),
      StrengthInputBus,
    ),
  ])
}).pipe(Layer.scopedDiscard)
