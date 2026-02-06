import * as Effect from 'effect/Effect'

import {
  ValidKeyboardKey,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { PatternRegistry } from './PatternRegistry.ts'

const keysHandlingPatterns = Array.from('12345678', ValidKeyboardKey)

export class PhysicalKeyboardButtonModelToPatternMappingService extends Effect.Service<PhysicalKeyboardButtonModelToPatternMappingService>()(
  'next-midi-demo/PhysicalKeyboardButtonModelToPatternMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(PatternRegistry.allPatterns, patterns =>
      makePhysicalButtonToParamMappingService(
        ValidKeyboardKeyOrder,
        keysHandlingPatterns,
        patterns,
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingPatterns),
      ),
    ),
  },
) {}
