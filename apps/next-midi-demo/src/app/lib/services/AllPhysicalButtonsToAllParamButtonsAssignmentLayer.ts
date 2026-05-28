import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import { AccordIndexData } from '../brandsAndDatas/Accord.ts'
import { KeyboardKeyPhysicalButtonData } from '../brandsAndDatas/KeyboardKey.ts'
import { NoteIdData } from '../brandsAndDatas/MIDIValues.ts'
import { PatternIndexData } from '../brandsAndDatas/Pattern.ts'
import { PhysicalButtonId } from '../brandsAndDatas/PhysicalButton.ts'
import { StrengthData } from '../brandsAndDatas/Strength.ts'
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

const toValueSet = <V>(datas: readonly { readonly value: V }[]) =>
  new Set(datas.map(_ => _.value))

const makeNoteDatas = (notes: Iterable<number>) =>
  Array.from(notes, NoteIdData.makeUnsafe)

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
  key => new KeyboardKeyPhysicalButtonData(key),
)
const keysHandlingAccordsSet = toValueSet(keyDatasHandlingAccords)

// Keyboard - Pattern
const keyboardPatternKeys = '12345678'
const keyDatasHandlingPatterns = Array.from(
  keyboardPatternKeys,
  key => new KeyboardKeyPhysicalButtonData(key),
)
const keysHandlingPatternsSet = toValueSet(keyDatasHandlingPatterns)

// Keyboard - Strength
const keyboardStrengthKeys = 'asdфыв'
const keyDatasHandlingStrengths = Array.from(
  keyboardStrengthKeys,
  key => new KeyboardKeyPhysicalButtonData(key),
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

// TODO: make TParamButton a ParamButtonData

export const AllButtonMappingLayer = Effect.gen(function* () {
  const [accords, patterns, strengths] = yield* Effect.all([
    AccordRegistry.allAccords,
    PatternRegistry.allPatterns,
    StrengthRegistry.allStrengths,
  ])

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
    { discard: true },
  )
}).pipe(Layer.scopedDiscard)
