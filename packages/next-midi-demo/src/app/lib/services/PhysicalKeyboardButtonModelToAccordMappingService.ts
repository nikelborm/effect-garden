import * as Effect from 'effect/Effect'

import { ValidKeyboardKeyData } from '../branded/StoreValues.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'

const keys = 'qwertyuiйцукенгш'

const keyDatasHandlingAccords = Array.from(
  keys,
  key => new ValidKeyboardKeyData(key),
)
const keysHandlingAccordsSet = new Set(
  keyDatasHandlingAccords.map(_ => _.value),
)

export class PhysicalKeyboardButtonModelToAccordMappingService extends Effect.Service<PhysicalKeyboardButtonModelToAccordMappingService>()(
  'next-midi-demo/PhysicalKeyboardButtonModelToAccordMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(AccordRegistry.allAccords, accords =>
      makePhysicalButtonToParamMappingService(
        keyDatasHandlingAccords,
        [...accords, ...accords],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingAccordsSet),
      ),
    ),
  },
) {}
