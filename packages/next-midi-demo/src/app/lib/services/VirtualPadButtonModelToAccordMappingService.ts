import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'

import type { RecordedAccordIndexes } from '../audioAssetHelpers.ts'
import { makeVirtualButtonTouchStateStream } from '../helpers/makeVirtualButtonTouchStateStream.ts'
import {
  AccordIndexData,
  AccordIndexDataOrder,
  AccordRegistry,
} from './AccordRegistry.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'

export class VirtualPadButtonModelToAccordMappingService extends Effect.Service<VirtualPadButtonModelToAccordMappingService>()(
  'next-midi-demo/VirtualPadButtonModelToAccordMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(AccordRegistry.allAccords, accords =>
      makePhysicalButtonToParamMappingService(
        AccordIndexDataOrder,
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
      ),
    ),
  },
) {}
