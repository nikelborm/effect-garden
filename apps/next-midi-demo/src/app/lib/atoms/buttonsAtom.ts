import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'

import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as Atom from '@effect-atom/atom/Atom'
import * as Result from '@effect-atom/atom/Result'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
// import * as LogLevel from 'effect/LogLevel'
import * as Stream from 'effect/Stream'

import {
  type Accord,
  AccordParamButtonData,
  defaultAccord,
} from '../brandsAndDatas/Accord.ts'
import {
  defaultPattern,
  type Pattern,
  PatternParamButtonData,
} from '../brandsAndDatas/Pattern.ts'
import {
  defaultStrength,
  type Strength,
  StrengthParamButtonData,
} from '../brandsAndDatas/Strength.ts'
import { AccordRegistry } from '../services/AccordRegistry.ts'
import { AllButtonMappingLayer } from '../services/AllPhysicalButtonsToAllParamButtonsAssignmentLayer.ts'
import { AppPlaybackStateService } from '../services/AppPlaybackStateService/AppPlaybackStateService.ts'
import { AssetDownloadSchedulerLive } from '../services/AssetDownloadScheduler.ts'
import { CurrentlySelectedAssetState } from '../services/CurrentlySelectedAssetState.ts'
import { DownloadManager } from '../services/DownloadManager.ts'
import {
  AccordInputBus,
  PatternInputBus,
  StrengthInputBus,
} from '../services/InputStreamBus.ts'
import { LoadedAssetSizeEstimationMap } from '../services/LoadedAssetSizeEstimationMap.ts'
import { OpfsWritableHandleManager } from '../services/OpfsWritableHandleManager.ts'
import {
  AccordParamButtonService,
  PatternParamButtonService,
  StrengthParamButtonService,
} from '../services/ParamButtonService.ts'
import { PatternRegistry } from '../services/PatternRegistry.ts'
import { RootDirectoryHandle } from '../services/RootDirectoryHandle.ts'
import { SelectedMIDIInputService } from '../services/SelectedMIDIInputService.ts'
import { StrengthRegistry } from '../services/StrengthRegistry.ts'

const BusLayer = Layer.mergeAll(
  AccordInputBus.Default,
  PatternInputBus.Default,
  StrengthInputBus.Default,
)

const AllButtonMappingServicesLayer = EFunction.pipe(
  AllButtonMappingLayer,
  Layer.provideMerge(SelectedMIDIInputService.Default),
  Layer.provideMerge(EMIDIAccess.layerSoftwareSynthSupported),
  Layer.catchAll(err =>
    Layer.effectDiscard(Effect.logError('MIDI access failed', err)),
  ),
  // Buses and registries are provided here so AllButtonMappingServicesLayer is
  // self-contained. Effect's layer memoization ensures the same instances
  // are shared with ParamButtonService.
  Layer.provideMerge(AccordInputBus.Default),
  Layer.provideMerge(PatternInputBus.Default),
  Layer.provideMerge(StrengthInputBus.Default),
  Layer.provideMerge(AccordRegistry.Default),
  Layer.provideMerge(PatternRegistry.Default),
  Layer.provideMerge(StrengthRegistry.Default),
)

const ParamButtonServicesLayer = Layer.mergeAll(
  AccordParamButtonService.Default,
  PatternParamButtonService.Default,
  StrengthParamButtonService.Default,
)

const AppLayer = ParamButtonServicesLayer.pipe(
  Layer.provideMerge(BusLayer),
  Layer.provideMerge(AllButtonMappingServicesLayer),
  Layer.provideMerge(AppPlaybackStateService.Default.pipe(Layer.orDie)),
  Layer.provideMerge(AssetDownloadSchedulerLive),
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

// export const isAccordButtonPressableAtom = Atom.family((accord: Accord) =>
//   EFunction.pipe(
//     accord,
//     AccordParamButtonData.make,
//     AccordParamButtonService.getPressabilityChangesStream,
//     Stream.unwrap,
//     s =>
//       runtime.atom(s, {
//         initialValue: accord !== defaultAccord,
//       }),
//     Atom.withFallback(
//       Atom.readable(() =>
//         Result.success(accord !== defaultAccord, { waiting: true }),
//       ),
//     ),

//     Atom.withServerValue(
//       EFunction.constant(
//         Result.success(accord !== defaultAccord, { waiting: true }),
//       ),
//     ),
//   ),
// )

// export const isPatternButtonPressableAtom = Atom.family((pattern: Pattern) =>
//   EFunction.pipe(
//     pattern,
//     PatternParamButtonData.make,
//     PatternParamButtonService.getPressabilityChangesStream,
//     Stream.unwrap,
//     // TODO patterns are no longer selected by default, so shouldn't compare to anything "default"
//     s =>
//       runtime.atom(s, {
//         initialValue: pattern !== defaultPattern,
//       }),
//     Atom.withFallback(
//       Atom.readable(() =>
//         Result.success(pattern !== defaultPattern, { waiting: true }),
//       ),
//     ),
//     Atom.withServerValue(
//       EFunction.constant(
//         Result.success(pattern !== defaultPattern, { waiting: true }),
//       ),
//     ),
//   ),
// )

// export const isStrengthButtonPressableAtom = Atom.family((strength: Strength) =>
//   EFunction.pipe(
//     strength,
//     StrengthParamButtonData.make,
//     StrengthParamButtonService.getPressabilityChangesStream,
//     Stream.unwrap,
//     s =>
//       runtime.atom(s, {
//         initialValue: strength !== defaultStrength,
//       }),
//     Atom.withFallback(
//       Atom.readable(() => Result.success(strength !== defaultStrength, { waiting: true })),
//     ),
//     Atom.withServerValue(
//       EFunction.constant(Result.success(strength !== defaultStrength, { waiting: true })),
//     ),
//   ),
// )

export const isAccordSelectedAtom = Atom.family((accord: Accord) =>
  EFunction.pipe(
    accord,
    AccordParamButtonData.make,
    AccordParamButtonService.getIsSelectedStream,
    Stream.unwrap,
    s =>
      runtime.atom(s, {
        initialValue: accord === defaultAccord,
      }),
    Atom.withFallback(
      Atom.readable(() =>
        Result.success(accord === defaultAccord, { waiting: true }),
      ),
    ),
    Atom.withServerValue(
      EFunction.constant(
        Result.success(accord === defaultAccord, { waiting: true }),
      ),
    ),
  ),
)

export const isPatternSelectedAtom = Atom.family((pattern: Pattern) =>
  EFunction.pipe(
    pattern,
    PatternParamButtonData.make,
    PatternParamButtonService.getIsSelectedStream,
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

export const isStrengthSelectedAtom = Atom.family((strength: Strength) =>
  EFunction.pipe(
    strength,
    StrengthParamButtonData.make,
    StrengthParamButtonService.getIsSelectedStream,
    Stream.unwrap,
    s =>
      runtime.atom(s, {
        initialValue: strength === defaultStrength,
      }),
    Atom.withFallback(
      Atom.readable(() =>
        Result.success(strength === defaultStrength, { waiting: true }),
      ),
    ),
    Atom.withServerValue(
      EFunction.constant(
        Result.success(strength === defaultStrength, { waiting: true }),
      ),
    ),
  ),
)

export const isAccordPressedAtom = Atom.family((accord: Accord) =>
  EFunction.pipe(
    accord,
    AccordParamButtonData.make,
    AccordParamButtonService.isPressedFlagChangesStream,
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

export const isPatternPressedAtom = Atom.family((pattern: Pattern) =>
  EFunction.pipe(
    pattern,
    PatternParamButtonData.make,
    PatternParamButtonService.isPressedFlagChangesStream,
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
    StrengthParamButtonData.make,
    StrengthParamButtonService.isPressedFlagChangesStream,
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

// export const isAccordButtonCurrentlyPlayingAtom = Atom.family(
//   (accord: Accord) =>
//     EFunction.pipe(
//       accord,
//       AccordParamButtonData.make,
//       AccordParamButtonService.isCurrentlyPlaying,
//       Stream.unwrap,
//       s =>
//         runtime.atom(s, {
//           initialValue: false,
//         }),
//       Atom.withFallback(
//         Atom.readable(() => Result.success(false, { waiting: true })),
//       ),
//       Atom.withServerValue(
//         EFunction.constant(Result.success(false, { waiting: true })),
//       ),
//     ),
// )

// export const isPatternButtonCurrentlyPlayingAtom = Atom.family(
//   (pattern: Pattern) =>
//     EFunction.pipe(
//       pattern,
//       PatternParamButtonData.make,
//       PatternParamButtonService.isCurrentlyPlaying,
//       Stream.unwrap,
//       s =>
//         runtime.atom(s, {
//           initialValue: false,
//         }),
//       Atom.withFallback(
//         Atom.readable(() => Result.success(false, { waiting: true })),
//       ),
//       Atom.withServerValue(
//         EFunction.constant(Result.success(false, { waiting: true })),
//       ),
//     ),
// )

// export const isStrengthButtonCurrentlyPlayingAtom = Atom.family(
//   (strength: Strength) =>
//     EFunction.pipe(
//       strength,
//       StrengthParamButtonData.make,
//       StrengthParamButtonService.isCurrentlyPlaying,
//       Stream.unwrap,
//       s =>
//         runtime.atom(s, {
//           initialValue: false,
//         }),
//       Atom.withFallback(
//         Atom.readable(() => Result.success(false, { waiting: true })),
//       ),
//       Atom.withServerValue(
//         EFunction.constant(Result.success(false, { waiting: true })),
//       ),
//     ),
// )

export const accordButtonDownloadPercentAtom = Atom.family((accord: Accord) =>
  EFunction.pipe(
    accord,
    AccordParamButtonData.make,
    AccordParamButtonService.getDownloadPercent,
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
  (pattern: Pattern) =>
    EFunction.pipe(
      pattern,
      PatternParamButtonData.make,
      PatternParamButtonService.getDownloadPercent,
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
      StrengthParamButtonData.make,
      StrengthParamButtonService.getDownloadPercent,
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

// TODO: add to all atoms?
// Atom.withLabel('notePressReleaseEvents'),
// Atom.keepAlive,
// Atom.withServerValueInitial,

// export const switchPlayPauseFnAtom = runtime
//   .fn(() =>
//     AppPlaybackStateService.switchPlayPauseFromCurrentlySelected.pipe(
//       Effect.orDie,
//       Effect.tapErrorCause(Effect.logError),
//     ),
//   )
//   .pipe(
//     Atom.withFallback(
//       Atom.readable(() => Result.success(undefined, { waiting: false })),
//     ),
//     Atom.withServerValue(
//       EFunction.constant(Result.success(undefined, { waiting: true })),
//     ),
//   )
