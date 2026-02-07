import * as Atom from '@effect-atom/atom/Atom'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import { AccordRegistry } from '../services/AccordRegistry.ts'
import { CurrentlySelectedAssetState } from '../services/CurrentlySelectedAssetState.ts'
import { LoadedAssetSizeEstimationMap } from '../services/LoadedAssetSizeEstimationMap.ts'
import { PatternRegistry } from '../services/PatternRegistry.ts'
import { RootDirectoryHandle } from '../services/RootDirectoryHandle.ts'
import { StrengthRegistry } from '../services/StrengthRegistry.ts'

const layer = CurrentlySelectedAssetState.Default.pipe(
  Layer.provide(LoadedAssetSizeEstimationMap.Default),
  Layer.provide(RootDirectoryHandle.Default),
  Layer.provide(PatternRegistry.Default),
  Layer.provide(AccordRegistry.Default),
  Layer.provide(StrengthRegistry.Default),
)

const runtime = Atom.runtime(layer)

export const currentAssetAtom = runtime.atom(
  Stream.unwrap(CurrentlySelectedAssetState.changes),
)
