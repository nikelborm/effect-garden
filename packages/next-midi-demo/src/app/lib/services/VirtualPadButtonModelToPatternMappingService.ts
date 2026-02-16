import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'

import type { RecordedPatternIndexes } from '../audioAssetHelpers.ts'
import { makeVirtualButtonTouchStateStream } from '../helpers/makeVirtualButtonTouchStateStream.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { PatternIndexData, PatternRegistry } from './PatternRegistry.ts'

export class VirtualPadButtonModelToPatternMappingService extends Effect.Service<VirtualPadButtonModelToPatternMappingService>()(
  'next-midi-demo/VirtualPadButtonModelToPatternMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(PatternRegistry.allPatterns, patterns =>
      makePhysicalButtonToParamMappingService(
        patterns.map(
          pattern =>
            new PatternIndexData(
              pattern.index,
            ) as unknown as PatternIndexData<RecordedPatternIndexes>,
        ),
        patterns,
        Stream.map(
          makeVirtualButtonTouchStateStream(new Set(['patternIndex'] as const)),
          ([element, state]) =>
            [
              new PatternIndexData(parseInt(element.patternIndex, 10)),
              state,
            ] as const,
        ),
      ),
    ),
  },
) {}
