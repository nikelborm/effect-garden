import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'

import { makeVirtualButtonTouchStateStream } from '../helpers/makeVirtualButtonTouchStateStream.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { StrengthData, StrengthRegistry } from './StrengthRegistry.ts'

export class VirtualPadButtonModelToStrengthMappingService extends Effect.Service<VirtualPadButtonModelToStrengthMappingService>()(
  'next-midi-demo/VirtualPadButtonModelToStrengthMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(StrengthRegistry.allStrengths, strengths =>
      makePhysicalButtonToParamMappingService(
        strengths.map(strength => new StrengthData(strength)),
        strengths,
        Stream.map(
          makeVirtualButtonTouchStateStream(new Set(['strength'] as const)),
          ([element, state]) =>
            [new StrengthData(element.strength), state] as const,
        ),
      ),
    ),
  },
) {}
