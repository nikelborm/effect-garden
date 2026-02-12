import * as Effect from 'effect/Effect'

import {
  ValidKeyboardKeyData,
  ValidKeyboardKeyDataOrder,
} from '../branded/StoreValues.ts'
import { makeKeyboardButtonPressStateStreamOfSomeKeys } from '../helpers/makeKeyboardButtonPressStateStreamOfSomeKeys.ts'
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

export class PhysicalKeyboardButtonModelToStrengthMappingService extends Effect.Service<PhysicalKeyboardButtonModelToStrengthMappingService>()(
  'next-midi-demo/PhysicalKeyboardButtonModelToStrengthMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(StrengthRegistry.allStrengths, strengths =>
      makePhysicalButtonToParamMappingService(
        ValidKeyboardKeyDataOrder,
        keyDatasHandlingStrengths,
        [...strengths, ...strengths],
        makeKeyboardButtonPressStateStreamOfSomeKeys(keysHandlingStrengthsSet),
      ),
    ),
  },
) {}
