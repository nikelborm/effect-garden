import type { Strength } from '../helpers/audioAssetHelpers.ts'

export interface CurrentSelectedAsset {
  readonly strength: Strength
}

export type Patch = Strength

export type AssetCompletionStatus =
  | { status: 'not finished'; currentBytes: number }
  | { status: 'almost finished: fetched, but not written' }
  | { status: 'finished' }
