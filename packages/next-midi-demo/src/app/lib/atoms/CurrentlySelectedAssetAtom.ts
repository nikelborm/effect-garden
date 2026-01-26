import * as Atom from '@effect-atom/atom/Atom'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import {
  CurrentlySelectedAccordIndexState,
  CurrentlySelectedAssetState,
  CurrentlySelectedPatternIndexState,
  CurrentlySelectedStrengthState,
} from '../services/CurrentlySelectedAssetState.ts'

const CurrentlySelectedAssetAtomRuntime = Atom.runtime(
  Layer.mergeAll(
    CurrentlySelectedAccordIndexState.Default,
    CurrentlySelectedPatternIndexState.Default,
    CurrentlySelectedStrengthState.Default,
    CurrentlySelectedAssetState.Default,
  ),
)

export const setAccordAtom = CurrentlySelectedAssetAtomRuntime.fn(
  CurrentlySelectedAccordIndexState.set,
)

export const setPatternAtom = CurrentlySelectedAssetAtomRuntime.fn(
  CurrentlySelectedPatternIndexState.set,
)

export const setStrengthAtom = CurrentlySelectedAssetAtomRuntime.fn(
  CurrentlySelectedStrengthState.set,
)

export const currentAssetAtom = CurrentlySelectedAssetAtomRuntime.atom(
  Stream.unwrap(CurrentlySelectedAssetState.changes),
)
