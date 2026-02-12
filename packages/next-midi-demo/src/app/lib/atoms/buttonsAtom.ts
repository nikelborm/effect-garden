import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'

import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as Atom from '@effect-atom/atom/Atom'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
import * as Stream from 'effect/Stream'

import { AccordRegistry } from '../services/AccordRegistry.ts'
import { AppPlaybackStateService } from '../services/AppPlaybackStateService.ts'
import { AssetDownloadScheduler } from '../services/AssetDownloadScheduler.ts'
import { CurrentlySelectedAssetState } from '../services/CurrentlySelectedAssetState.ts'
import { DownloadManager } from '../services/DownloadManager.ts'
import { LoadedAssetSizeEstimationMap } from '../services/LoadedAssetSizeEstimationMap.ts'
import { OpfsWritableHandleManager } from '../services/OpfsWritableHandleManager.ts'
import { PatternRegistry } from '../services/PatternRegistry.ts'
import { PhysicalKeyboardButtonModelToAccordMappingService } from '../services/PhysicalKeyboardButtonModelToAccordMappingService.ts'
import { PhysicalKeyboardButtonModelToPatternMappingService } from '../services/PhysicalKeyboardButtonModelToPatternMappingService.ts'
import { PhysicalKeyboardButtonModelToStrengthMappingService } from '../services/PhysicalKeyboardButtonModelToStrengthMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToAccordMappingService } from '../services/PhysicalMIDIDeviceButtonModelToAccordMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToPatternMappingService } from '../services/PhysicalMIDIDeviceButtonModelToPatternMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToStrengthMappingService } from '../services/PhysicalMIDIDeviceButtonModelToStrengthMappingService.ts'
import { RootDirectoryHandle } from '../services/RootDirectoryHandle.ts'
import { SelectedMIDIInputService } from '../services/SelectedMIDIInputService.ts'
import { StrengthRegistry } from '../services/StrengthRegistry.ts'
import { UIButtonService } from '../services/UIButtonService.ts'
import { VirtualPadButtonModelToAccordMappingService } from '../services/VirtualPadButtonModelToAccordMappingService.ts'
import { VirtualPadButtonModelToPatternMappingService } from '../services/VirtualPadButtonModelToPatternMappingService.ts'
import { VirtualPadButtonModelToStrengthMappingService } from '../services/VirtualPadButtonModelToStrengthMappingService.ts'

const MIDIButtonMappingsLayer = EFunction.pipe(
  PhysicalMIDIDeviceButtonModelToAccordMappingService.Default,
  Layer.merge(PhysicalMIDIDeviceButtonModelToPatternMappingService.Default),
  Layer.merge(PhysicalMIDIDeviceButtonModelToStrengthMappingService.Default),
  Layer.provide(SelectedMIDIInputService.Default),
  Layer.provide(EMIDIAccess.layerSoftwareSynthSupported),
  Layer.catchAll(midiAccessErr =>
    Layer.mergeAll(
      Layer.effectDiscard(
        Effect.log('Error while acquiring MIDI access', midiAccessErr),
      ),
      PhysicalMIDIDeviceButtonModelToAccordMappingService.OnMIDIDisabled,
      PhysicalMIDIDeviceButtonModelToPatternMappingService.OnMIDIDisabled,
      PhysicalMIDIDeviceButtonModelToStrengthMappingService.OnMIDIDisabled,
    ),
  ),
)

// const MIDIButtonMappingsLayer = EFunction.pipe(
//   PhysicalMIDIDeviceButtonModelToAccordMappingService.OnMIDIDisabled,
//   Layer.merge(
//     PhysicalMIDIDeviceButtonModelToPatternMappingService.OnMIDIDisabled,
//   ),
// )

const AppLayer = UIButtonService.Default.pipe(
  Layer.provideMerge(PhysicalKeyboardButtonModelToAccordMappingService.Default),
  Layer.provideMerge(
    PhysicalKeyboardButtonModelToPatternMappingService.Default,
  ),
  Layer.provideMerge(
    PhysicalKeyboardButtonModelToStrengthMappingService.Default,
  ),
  Layer.provideMerge(VirtualPadButtonModelToAccordMappingService.Default),
  Layer.provideMerge(VirtualPadButtonModelToPatternMappingService.Default),
  Layer.provideMerge(VirtualPadButtonModelToStrengthMappingService.Default),

  Layer.provideMerge(MIDIButtonMappingsLayer),
  Layer.provideMerge(AppPlaybackStateService.Default.pipe(Layer.orDie)),
  Layer.provideMerge(AssetDownloadScheduler.Default),
  Layer.provideMerge(DownloadManager.Default),
  Layer.provideMerge(OpfsWritableHandleManager.Default),
  // Layer.provideMerge(BrowserHttpClient.layerXMLHttpRequest),
  Layer.provideMerge(FetchHttpClient.layer),
  Layer.provideMerge(CurrentlySelectedAssetState.Default),
  Layer.provideMerge(LoadedAssetSizeEstimationMap.Default),
  Layer.provideMerge(RootDirectoryHandle.Default),
  Layer.provideMerge(AccordRegistry.Default),
  Layer.provideMerge(PatternRegistry.Default),
  Layer.provideMerge(StrengthRegistry.Default),
  Layer.provideMerge(Logger.pretty),
)

const runtime = Atom.runtime(AppLayer)

// UIButtonService.getPressureReportOfPattern
// UIButtonService.getPressureReportOfAccord

export const isAccordButtonPressableAtom = Atom.family(
  EFunction.flow(
    UIButtonService.getAccordButtonPressabilityChangesStream,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const isPatternButtonPressableAtom = Atom.family(
  EFunction.flow(
    UIButtonService.getPatternButtonPressabilityChangesStream,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const isStrengthButtonPressableAtom = Atom.family(
  EFunction.flow(
    UIButtonService.getStrengthButtonPressabilityChangesStream,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const isAccordSelectedAtom = Atom.family(
  EFunction.flow(
    UIButtonService.getIsSelectedAccordStream,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const isPatternSelectedAtom = Atom.family(
  EFunction.flow(
    UIButtonService.getIsSelectedPatternStream,
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

export const isAccordPressedAtom = Atom.family(
  EFunction.flow(
    UIButtonService.isAccordButtonPressedFlagChangesStream,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const isPatternPressedAtom = Atom.family(
  EFunction.flow(
    UIButtonService.isPatternButtonPressedFlagChangesStream,
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

export const isAccordButtonCurrentlyPlayingAtom = Atom.family(
  EFunction.flow(
    UIButtonService.isAccordButtonCurrentlyPlaying,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const isPatternButtonCurrentlyPlayingAtom = Atom.family(
  EFunction.flow(
    UIButtonService.isPatternButtonCurrentlyPlaying,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const isStrengthButtonCurrentlyPlayingAtom = Atom.family(
  EFunction.flow(
    UIButtonService.isStrengthButtonCurrentlyPlaying,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const accordButtonDownloadPercentAtom = Atom.family(
  EFunction.flow(
    UIButtonService.getAccordButtonDownloadPercent,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const patternButtonDownloadPercentAtom = Atom.family(
  EFunction.flow(
    UIButtonService.getPatternButtonDownloadPercent,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const strengthButtonDownloadPercentAtom = Atom.family(
  EFunction.flow(
    UIButtonService.getStrengthButtonDownloadPercent,
    Stream.unwrap,
    s => runtime.atom(s),
    Atom.withServerValueInitial,
  ),
)

export const isPlayStopButtonPressableAtom = EFunction.pipe(
  AppPlaybackStateService.playStopButtonPressableFlagChangesStream,
  Stream.unwrap,
  s => runtime.atom(s),
  Atom.withServerValueInitial,
)

// TODO: add to all atoms
// Atom.withLabel('notePressReleaseEvents'),
// Atom.keepAlive,
// Atom.withServerValueInitial,

export const switchPlayPauseFnAtom = runtime.fn(() =>
  AppPlaybackStateService.switchPlayPauseFromCurrentlySelected.pipe(
    Effect.orDie,
    Effect.tapErrorCause(Effect.logError),
  ),
)
