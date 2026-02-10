import * as Effect from 'effect/Effect'
import * as Order from 'effect/Order'
import * as Stream from 'effect/Stream'

import { makeVirtualButtonTouchStateStream } from '../helpers/makeVirtualButtonTouchStateStream.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'

export class VirtualPadButtonModelToAccordMappingService extends Effect.Service<VirtualPadButtonModelToAccordMappingService>()(
  'next-midi-demo/VirtualPadButtonModelToAccordMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(AccordRegistry.allAccords, accords =>
      makePhysicalButtonToParamMappingService(
        Order.number,
        accords.map(e => e.index),
        accords,
        Stream.map(
          makeVirtualButtonTouchStateStream(new Set(['accordIndex'] as const)),
          ([element, state]) =>
            [parseInt(element.accordIndex, 10), state] as const,
        ),
      ),
    ),
  },
) {}
