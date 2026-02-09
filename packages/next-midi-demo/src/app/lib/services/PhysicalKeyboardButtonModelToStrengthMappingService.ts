import * as Effect from 'effect/Effect'

import {
  ValidKeyboardKey,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

const keysHandlingStrengths = Array.from('asd', ValidKeyboardKey)

export class PhysicalKeyboardButtonModelToStrengthMappingService extends Effect.Service<PhysicalKeyboardButtonModelToStrengthMappingService>()(
  'next-midi-demo/PhysicalKeyboardButtonModelToStrengthMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(StrengthRegistry.allStrengths, strengths =>
      makePhysicalButtonToParamMappingService(
        ValidKeyboardKeyOrder,
        keysHandlingStrengths,
        strengths,
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingStrengths),
      ),
    ),
  },
) {}
