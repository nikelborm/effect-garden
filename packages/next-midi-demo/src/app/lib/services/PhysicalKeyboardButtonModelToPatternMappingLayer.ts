import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { ValidKeyboardKeyData } from '../branded/StoreValues.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { PatternInputBus } from './InputStreamBus.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { PatternRegistry } from './PatternRegistry.ts'

const keys = '12345678'
const keyDatasHandlingPatterns = Array.from(
  keys,
  key => new ValidKeyboardKeyData(key),
)
const keysHandlingPatternsSet = new Set(
  keyDatasHandlingPatterns.map(_ => _.value),
)

export const PhysicalKeyboardButtonModelToPatternMappingLayer =
  Layer.scopedDiscard(
    Effect.flatMap(PatternRegistry.allPatterns, patterns =>
      makePhysicalButtonToParamMappingService(
        keyDatasHandlingPatterns,
        patterns,
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingPatternsSet),
        PatternInputBus,
      ),
    ),
  )
