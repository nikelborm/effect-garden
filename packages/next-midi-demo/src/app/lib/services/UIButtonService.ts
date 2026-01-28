import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'

import { RegisteredButtonID } from '../branded/StoreValues.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { PatternRegistry } from './PatternRegistry.ts'

export class UIButtonService extends Effect.Service<UIButtonService>()(
  'next-midi-demo/UIButtonService',
  {
    accessors: true,
    dependencies: [
      PatternRegistry.Default,
      AccordRegistry.Default,
      CurrentlySelectedAssetState.Default,
      LoadedAssetSizeEstimationMap.Default,
    ],
    effect: Effect.gen(function* () {
      const accordRegistry = yield* AccordRegistry
      const patternRegistry = yield* PatternRegistry
      const currentlySelectedAssetState = yield* CurrentlySelectedAssetState
      const loadedAssetSizeEstimationMap = yield* LoadedAssetSizeEstimationMap

      const accordButtonIds = Effect.map(
        accordRegistry.allAccords,
        EArray.map(({ id }) => RegisteredButtonID(`accord-button-${id}`)),
      )

      const patternButtonIds = Effect.map(
        patternRegistry.allPatterns,
        EArray.map(({ index }) =>
          RegisteredButtonID(`pattern-button-${index}`),
        ),
      )

      return {
        accordButtonIds,
        patternButtonIds,
      }
    }),
  },
) {}
