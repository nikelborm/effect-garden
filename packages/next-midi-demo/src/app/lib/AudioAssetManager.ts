import * as Effect from 'effect/Effect'
import * as Ref from 'effect/Ref'
import * as Schema from 'effect/Schema'

import type {
  PatternPointer,
  RecordedAccordIndexes,
  RecordedPatternIndexes,
  Strength,
} from './audioAssetHelpers.ts'

// TODO: proper error handling for example when TypeError or ReferenceError on UnsupportedError (navigator.storage.getDirectory)

// Effect.provide(FetchHttpClient.layer),

// export class AudioAssetManager extends Effect.Service<AudioAssetManager>()(
//   'AudioAssetManager',
//   {
//     effect: Effect.gen(function* () {
//       const stateRef = Ref.make({})
//       const currentlyActiveFibers = []
//       return {
//         scheduleLoadingExtremelyHighPriorityAsset: (
//           asset: AssetPointer[],
//         ): Effect.Effect<void> => {
//           return Effect.void
//         },
//         scheduleLoadingAsset: () => {},
//         isAssetReady: (asset: AssetPointer) => {},
//         getAssetDownloadStatusFrom0To1: (asset: AssetPointer) => {},
//       }
//     }),
//   },
// ) {}
