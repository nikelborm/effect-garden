import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'

import {
  ValidKeyboardKey,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import { makeKeyboardSliceMapStream } from '../helpers/makeKeyboardSliceMapStream.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { PatternRegistry } from './PatternRegistry.ts'

const keysHandlingPatterns = Array.from('12345678', ValidKeyboardKey)

export class PhysicalKeyboardButtonModelToPatternMappingService extends Effect.Service<PhysicalKeyboardButtonModelToPatternMappingService>()(
  'next-midi-demo/PhysicalKeyboardButtonModelToPatternMappingService',
  {
    accessors: true,
    dependencies: [PatternRegistry.Default],
    scoped: Effect.flatMap(PatternRegistry.allPatterns, patterns =>
      makePhysicalButtonToParamMappingService(
        ValidKeyboardKeyOrder,
        keysHandlingPatterns,
        patterns,
        Stream.map(makeKeyboardSliceMapStream(keysHandlingPatterns), _ => [
          _.key,
          _.keyboardKeyPressState,
        ]),
      ),
    ),
  },
) {}
