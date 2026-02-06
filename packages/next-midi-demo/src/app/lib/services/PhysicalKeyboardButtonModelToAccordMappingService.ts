import * as Effect from 'effect/Effect'

import {
  ValidKeyboardKey,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'

const keysHandlingAccords = Array.from('qwertyui', ValidKeyboardKey)

export class PhysicalKeyboardButtonModelToAccordMappingService extends Effect.Service<PhysicalKeyboardButtonModelToAccordMappingService>()(
  'next-midi-demo/PhysicalKeyboardButtonModelToAccordMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(AccordRegistry.allAccords, accords =>
      makePhysicalButtonToParamMappingService(
        ValidKeyboardKeyOrder,
        keysHandlingAccords,
        accords,
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingAccords),
      ),
    ),
  },
) {}
