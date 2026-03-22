import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import { makeVirtualButtonTouchStateStream } from '../helpers/makeVirtualButtonTouchStateStream.ts'
import { StrengthInputBus } from './InputStreamBus.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { StrengthData, StrengthRegistry } from './StrengthRegistry.ts'

export const VirtualPadButtonModelToStrengthMappingLayer = Layer.scopedDiscard(
  Effect.flatMap(StrengthRegistry.allStrengths, strengths =>
    makePhysicalButtonToParamMappingService(
      strengths.map(strength => new StrengthData(strength)),
      strengths,
      Stream.map(
        makeVirtualButtonTouchStateStream(new Set(['strength'] as const)),
        ([element, state]) => [new StrengthData(element.strength), state] as const,
      ),
      StrengthInputBus,
    ),
  ),
)
