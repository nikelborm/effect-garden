import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'

import {
  ValidKeyboardKey,
  ValidKeyboardKeyOrder,
} from '../branded/StoreValues.ts'
import { makeKeyboardSliceMapStream } from '../helpers/makeKeyboardSliceMapStream.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'

const keysHandlingAccords = Array.from('qwertyui', ValidKeyboardKey)

export class PhysicalKeyboardButtonModelToAccordMappingService extends Effect.Service<PhysicalKeyboardButtonModelToAccordMappingService>()(
  'next-midi-demo/PhysicalKeyboardButtonModelToAccordMappingService',
  {
    accessors: true,
    dependencies: [AccordRegistry.Default],
    scoped: Effect.flatMap(AccordRegistry.allAccords, accords =>
      makePhysicalButtonToParamMappingService(
        ValidKeyboardKeyOrder,
        keysHandlingAccords,
        accords,
        Stream.map(makeKeyboardSliceMapStream(keysHandlingAccords), _ => [
          _.key,
          _.keyboardKeyPressState,
        ]),
      ),
    ),
  },
) {}
