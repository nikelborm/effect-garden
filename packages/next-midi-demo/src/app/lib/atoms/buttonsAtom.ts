// import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'

import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as Atom from '@effect-atom/atom/Atom'
import * as Result from '@effect-atom/atom/Result'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
// import * as LogLevel from 'effect/LogLevel'
import * as Stream from 'effect/Stream'

import type { Strength } from '../audioAssetHelpers.ts'
import {
  AccordRegistry,
  type AllAccordUnion,
} from '../services/AccordRegistry.ts'
import { AppPlaybackStateService } from '../services/AppPlaybackStateService.ts'
import { AssetDownloadScheduler } from '../services/AssetDownloadScheduler.ts'
import { CurrentlySelectedAssetState } from '../services/CurrentlySelectedAssetState.ts'
import { DownloadManager } from '../services/DownloadManager.ts'
import { LoadedAssetSizeEstimationMap } from '../services/LoadedAssetSizeEstimationMap.ts'
import { OpfsWritableHandleManager } from '../services/OpfsWritableHandleManager.ts'
import {
  type AllPatternUnion,
  PatternRegistry,
} from '../services/PatternRegistry.ts'
import { PhysicalKeyboardButtonModelToAccordMappingService } from '../services/PhysicalKeyboardButtonModelToAccordMappingService.ts'
import { PhysicalKeyboardButtonModelToPatternMappingService } from '../services/PhysicalKeyboardButtonModelToPatternMappingService.ts'
import { PhysicalKeyboardButtonModelToStrengthMappingService } from '../services/PhysicalKeyboardButtonModelToStrengthMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToAccordMappingService } from '../services/PhysicalMIDIDeviceButtonModelToAccordMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToPatternMappingService } from '../services/PhysicalMIDIDeviceButtonModelToPatternMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToStrengthMappingService } from '../services/PhysicalMIDIDeviceButtonModelToStrengthMappingService.ts'
import { RootDirectoryHandle } from '../services/RootDirectoryHandle.ts'
// import { SelectedMIDIInputService } from '../services/SelectedMIDIInputService.ts'
import { StrengthRegistry } from '../services/StrengthRegistry.ts'
import { UIButtonService } from '../services/UIButtonService.ts'
import { VirtualPadButtonModelToAccordMappingService } from '../services/VirtualPadButtonModelToAccordMappingService.ts'
import { VirtualPadButtonModelToPatternMappingService } from '../services/VirtualPadButtonModelToPatternMappingService.ts'
import { VirtualPadButtonModelToStrengthMappingService } from '../services/VirtualPadButtonModelToStrengthMappingService.ts'

const OnMIDIDisabled = Layer.mergeAll(
  PhysicalMIDIDeviceButtonModelToAccordMappingService.OnMIDIDisabled,
  PhysicalMIDIDeviceButtonModelToPatternMappingService.OnMIDIDisabled,
  PhysicalMIDIDeviceButtonModelToStrengthMappingService.OnMIDIDisabled,
)

// const MIDIButtonMappingsLayer = EFunction.pipe(
//   PhysicalMIDIDeviceButtonModelToAccordMappingService.Default,
//   Layer.merge(PhysicalMIDIDeviceButtonModelToPatternMappingService.Default),
//   Layer.merge(PhysicalMIDIDeviceButtonModelToStrengthMappingService.Default),
//   Layer.provideMerge(SelectedMIDIInputService.Default),
//   Layer.provideMerge(EMIDIAccess.layerSoftwareSynthSupported),
//   Layer.catchAll(midiAccessErr =>
//     Layer.merge(
//       OnMIDIDisabled,
//       Layer.effectDiscard(
//         Effect.logError('Error while acquiring MIDI access', midiAccessErr),
//       ),
//     ),
//   ),
// )

const MIDIButtonMappingsLayer = OnMIDIDisabled

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
  // Layer.provideMerge(Logger.minimumLogLevel(LogLevel.Warning)),
)

const runtime = Atom.runtime(AppLayer)

// UIButtonService.getPressureReportOfPattern
// UIButtonService.getPressureReportOfAccord

export const isAccordButtonPressableAtom = Atom.family(
  (accord: AllAccordUnion) =>
    EFunction.pipe(
      accord,
      UIButtonService.getAccordButtonPressabilityChangesStream,
      Stream.unwrap,
      s =>
        runtime.atom(s, {
          initialValue: accord.index !== 0,
        }),
      Atom.withFallback(
        Atom.readable(() =>
          Result.success(accord.index !== 0, { waiting: true }),
        ),
      ),

      Atom.withServerValue(
        EFunction.constant(
          Result.success(accord.index !== 0, { waiting: true }),
        ),
      ),
    ),
)

export const isPatternButtonPressableAtom = Atom.family(
  (pattern: AllPatternUnion) =>
    EFunction.pipe(
      pattern,
      UIButtonService.getPatternButtonPressabilityChangesStream,
      Stream.unwrap,
      s =>
        runtime.atom(s, {
          initialValue: pattern.index !== 0,
        }),
      Atom.withFallback(
        Atom.readable(() =>
          Result.success(pattern.index !== 0, { waiting: true }),
        ),
      ),
      Atom.withServerValue(
        EFunction.constant(
          Result.success(pattern.index !== 0, { waiting: true }),
        ),
      ),
    ),
)

export const isStrengthButtonPressableAtom = Atom.family((strength: Strength) =>
  EFunction.pipe(
    strength,
    UIButtonService.getStrengthButtonPressabilityChangesStream,
    Stream.unwrap,
    s =>
      runtime.atom(s, {
        initialValue: strength !== 'm',
      }),
    Atom.withFallback(
      Atom.readable(() => Result.success(strength !== 'm', { waiting: true })),
    ),
    Atom.withServerValue(
      EFunction.constant(Result.success(strength !== 'm', { waiting: true })),
    ),
  ),
)

export const isAccordSelectedAtom = Atom.family((accord: AllAccordUnion) =>
  EFunction.pipe(
    accord,
    UIButtonService.getIsSelectedAccordStream,
    Stream.unwrap,
    s =>
      runtime.atom(s, {
        initialValue: accord.index === 0,
      }),
    Atom.withFallback(
      Atom.readable(() =>
        Result.success(accord.index === 0, { waiting: true }),
      ),
    ),
    Atom.withServerValue(
      EFunction.constant(Result.success(accord.index === 0, { waiting: true })),
    ),
  ),
)

export const isPatternSelectedAtom = Atom.family((pattern: AllPatternUnion) =>
  EFunction.pipe(
    pattern,
    UIButtonService.getIsSelectedPatternStream,
    Stream.unwrap,
    s =>
      runtime.atom(s, {
        initialValue: pattern.index === 0,
      }),
    Atom.withFallback(
      Atom.readable(() =>
        Result.success(pattern.index === 0, { waiting: true }),
      ),
    ),
    Atom.withServerValue(
      EFunction.constant(
        Result.success(pattern.index === 0, { waiting: true }),
      ),
    ),
  ),
)

export const isStrengthSelectedAtom = Atom.family((strength: Strength) =>
  EFunction.pipe(
    strength,
    UIButtonService.getIsSelectedStrengthStream,
    Stream.unwrap,
    s =>
      runtime.atom(s, {
        initialValue: strength === 'm',
      }),
    Atom.withFallback(
      Atom.readable(() => Result.success(strength === 'm', { waiting: true })),
    ),
    Atom.withServerValue(
      EFunction.constant(Result.success(strength === 'm', { waiting: true })),
    ),
  ),
)

export const isAccordPressedAtom = Atom.family((accord: AllAccordUnion) =>
  EFunction.pipe(
    accord,
    UIButtonService.isAccordButtonPressedFlagChangesStream,
    Stream.unwrap,
    s =>
      runtime.atom(s, {
        initialValue: false,
      }),
    Atom.withFallback(
      Atom.readable(() => Result.success(false, { waiting: true })),
    ),
    Atom.withServerValue(
      EFunction.constant(Result.success(false, { waiting: true })),
    ),
  ),
)

export const isPatternPressedAtom = Atom.family((pattern: AllPatternUnion) =>
  EFunction.pipe(
    pattern,
    UIButtonService.isPatternButtonPressedFlagChangesStream,
    Stream.unwrap,
    s =>
      runtime.atom(s, {
        initialValue: false,
      }),
    Atom.withFallback(
      Atom.readable(() => Result.success(false, { waiting: true })),
    ),
    Atom.withServerValue(
      EFunction.constant(Result.success(false, { waiting: true })),
    ),
  ),
)

export const isStrengthPressedAtom = Atom.family((strength: Strength) =>
  EFunction.pipe(
    strength,
    UIButtonService.isStrengthButtonPressedFlagChangesStream,
    Stream.unwrap,
    s =>
      runtime.atom(s, {
        initialValue: false,
      }),
    Atom.withFallback(
      Atom.readable(() => Result.success(false, { waiting: true })),
    ),
    Atom.withServerValue(
      EFunction.constant(Result.success(false, { waiting: true })),
    ),
  ),
)

export const isAccordButtonCurrentlyPlayingAtom = Atom.family(
  (accord: AllAccordUnion) =>
    EFunction.pipe(
      accord,
      UIButtonService.isAccordButtonCurrentlyPlaying,
      Stream.unwrap,
      s =>
        runtime.atom(s, {
          initialValue: false,
        }),
      Atom.withFallback(
        Atom.readable(() => Result.success(false, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(Result.success(false, { waiting: true })),
      ),
    ),
)

export const isPatternButtonCurrentlyPlayingAtom = Atom.family(
  (pattern: AllPatternUnion) =>
    EFunction.pipe(
      pattern,
      UIButtonService.isPatternButtonCurrentlyPlaying,
      Stream.unwrap,
      s =>
        runtime.atom(s, {
          initialValue: false,
        }),
      Atom.withFallback(
        Atom.readable(() => Result.success(false, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(Result.success(false, { waiting: true })),
      ),
    ),
)

export const isStrengthButtonCurrentlyPlayingAtom = Atom.family(
  (strength: Strength) =>
    EFunction.pipe(
      strength,
      UIButtonService.isStrengthButtonCurrentlyPlaying,
      Stream.unwrap,
      s =>
        runtime.atom(s, {
          initialValue: false,
        }),
      Atom.withFallback(
        Atom.readable(() => Result.success(false, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(Result.success(false, { waiting: true })),
      ),
    ),
)

export const accordButtonDownloadPercentAtom = Atom.family(
  (accord: AllAccordUnion) =>
    EFunction.pipe(
      accord,
      UIButtonService.getAccordButtonDownloadPercent,
      Stream.unwrap,
      s =>
        runtime.atom(s, {
          initialValue: 0,
        }),
      Atom.withFallback(
        Atom.readable(() => Result.success(0, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(Result.success(0, { waiting: true })),
      ),
    ),
)

export const patternButtonDownloadPercentAtom = Atom.family(
  (pattern: AllPatternUnion) =>
    EFunction.pipe(
      pattern,
      UIButtonService.getPatternButtonDownloadPercent,
      Stream.unwrap,
      s =>
        runtime.atom(s, {
          initialValue: 0,
        }),
      Atom.withFallback(
        Atom.readable(() => Result.success(0, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(Result.success(0, { waiting: true })),
      ),
    ),
)

export const strengthButtonDownloadPercentAtom = Atom.family(
  (strength: Strength) =>
    EFunction.pipe(
      strength,
      UIButtonService.getStrengthButtonDownloadPercent,
      Stream.unwrap,
      s =>
        runtime.atom(s, {
          initialValue: 0,
        }),
      Atom.withFallback(
        Atom.readable(() => Result.success(0, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(Result.success(0, { waiting: true })),
      ),
    ),
)

export const isPlayStopButtonPressableAtom = EFunction.pipe(
  AppPlaybackStateService.playStopButtonPressableFlagChangesStream,
  Stream.unwrap,
  s =>
    runtime.atom(s, {
      initialValue: false,
    }),
  Atom.withFallback(
    Atom.readable(() => Result.success(false, { waiting: true })),
  ),
  Atom.withServerValue(
    EFunction.constant(Result.success(false, { waiting: true })),
  ),
)

// TODO: add to all atoms
// Atom.withLabel('notePressReleaseEvents'),
// Atom.keepAlive,
// Atom.withServerValueInitial,

export const switchPlayPauseFnAtom = runtime
  .fn(() =>
    AppPlaybackStateService.switchPlayPauseFromCurrentlySelected.pipe(
      Effect.orDie,
      Effect.tapErrorCause(Effect.logError),
    ),
  )
  .pipe(
    Atom.withFallback(
      Atom.readable(() => Result.success(undefined, { waiting: false })),
    ),
    Atom.withServerValue(
      EFunction.constant(Result.success(undefined, { waiting: true })),
    ),
  )
