import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { ValidKeyboardKeyData } from '../branded/StoreValues.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { AccordInputBus } from './InputStreamBus.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'

const keys = 'qwertyuiйцукенгш'

const keyDatasHandlingAccords = Array.from(
  keys,
  key => new ValidKeyboardKeyData(key),
)
const keysHandlingAccordsSet = new Set(
  keyDatasHandlingAccords.map(_ => _.value),
)

export const PhysicalKeyboardButtonModelToAccordMappingLayer =
  Layer.scopedDiscard(
    Effect.flatMap(AccordRegistry.allAccords, accords =>
      makePhysicalButtonToParamMappingService(
        keyDatasHandlingAccords,
        [...accords, ...accords],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingAccordsSet),
        AccordInputBus,
      ),
    ),
  )
