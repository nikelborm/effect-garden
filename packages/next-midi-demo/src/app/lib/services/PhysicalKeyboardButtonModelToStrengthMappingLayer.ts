import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { ValidKeyboardKeyData } from '../branded/StoreValues.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
import { StrengthInputBus } from './InputStreamBus.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

const keys = 'asdфыв'
const keyDatasHandlingStrengths = Array.from(
  keys,
  key => new ValidKeyboardKeyData(key),
)
const keysHandlingStrengthsSet = new Set(
  keyDatasHandlingStrengths.map(_ => _.value),
)

export const PhysicalKeyboardButtonModelToStrengthMappingLayer =
  Layer.scopedDiscard(
    Effect.flatMap(StrengthRegistry.allStrengths, strengths =>
      makePhysicalButtonToParamMappingService(
        keyDatasHandlingStrengths,
        [...strengths, ...strengths],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingStrengthsSet),
        StrengthInputBus,
      ),
    ),
  )
