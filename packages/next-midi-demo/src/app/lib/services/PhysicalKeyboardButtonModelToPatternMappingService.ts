import * as Effect from 'effect/Effect'

import { ValidKeyboardKeyData } from '../branded/StoreValues.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
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

export class PhysicalKeyboardButtonModelToPatternMappingService extends Effect.Service<PhysicalKeyboardButtonModelToPatternMappingService>()(
  'next-midi-demo/PhysicalKeyboardButtonModelToPatternMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(PatternRegistry.allPatterns, patterns =>
      makePhysicalButtonToParamMappingService(
        keyDatasHandlingPatterns,
        patterns,
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingPatternsSet),
      ),
    ),
  },
) {}
