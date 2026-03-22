import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import type { RecordedAccordIndexes } from '../audioAssetHelpers.ts'
import { makeVirtualButtonTouchStateStream } from '../helpers/makeVirtualButtonTouchStateStream.ts'
import { AccordIndexData, AccordRegistry } from './AccordRegistry.ts'
import { AccordInputBus } from './InputStreamBus.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'

export const VirtualPadButtonModelToAccordMappingLayer = Layer.scopedDiscard(
  Effect.flatMap(AccordRegistry.allAccords, accords =>
    makePhysicalButtonToParamMappingService(
      accords.map(
        accord =>
          new AccordIndexData(
            accord.index,
          ) as unknown as AccordIndexData<RecordedAccordIndexes>,
      ),
      accords,
      Stream.map(
        makeVirtualButtonTouchStateStream(new Set(['accordIndex'] as const)),
        ([element, state]) =>
          [
            new AccordIndexData(parseInt(element.accordIndex, 10)),
            state,
          ] as const,
      ),
      AccordInputBus,
    ),
  ),
)
