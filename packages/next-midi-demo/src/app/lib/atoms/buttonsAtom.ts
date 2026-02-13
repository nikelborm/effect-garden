import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as Atom from '@effect-atom/atom/Atom'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
import * as Stream from 'effect/Stream'

import { AppPlaybackStateService } from '../services/AppPlaybackStateService.ts'
import { CurrentlySelectedAssetState } from '../services/CurrentlySelectedAssetState.ts'
import { StrengthRegistry } from '../services/StrengthRegistry.ts'
import { UIButtonService } from '../services/UIButtonService.ts'
import { VirtualPadButtonModelToStrengthMappingService } from '../services/VirtualPadButtonModelToStrengthMappingService.ts'

const AppLayer = UIButtonService.Default.pipe(
  Layer.provideMerge(VirtualPadButtonModelToStrengthMappingService.Default),

  Layer.provideMerge(AppPlaybackStateService.Default.pipe(Layer.orDie)),
  Layer.provideMerge(FetchHttpClient.layer),
  Layer.provideMerge(CurrentlySelectedAssetState.Default),
  Layer.provideMerge(StrengthRegistry.Default),
  Layer.provideMerge(Logger.pretty),
)

const runtime = Atom.runtime(AppLayer)

export const isStrengthButtonPressableAtom = Atom.family(
  EFunction.flow(
    UIButtonService.getStrengthButtonPressabilityChangesStream,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const isStrengthSelectedAtom = Atom.family(
  EFunction.flow(
    UIButtonService.getIsSelectedStrengthStream,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const isStrengthPressedAtom = Atom.family(
  EFunction.flow(
    UIButtonService.isStrengthButtonPressedFlagChangesStream,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const strengthsAtom = runtime.atom(StrengthRegistry.allStrengths)
