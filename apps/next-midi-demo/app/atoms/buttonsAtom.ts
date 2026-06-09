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
  type Pattern,
  PatternParamButtonData,
} from '../brandsAndDatas/Pattern.ts'
import {
  defaultStrength,
  type Strength,
  StrengthParamButtonData,
} from '../brandsAndDatas/Strength.ts'
import { AccordRegistry } from '../services/AccordRegistry.ts'
import {
  KeyboardButtonMappingLayer,
  MIDIPadButtonMappingLayer,
  OnScreenButtonMappingLayer,
} from '../services/AllPhysicalButtonsToAllParamButtonsAssignmentLayer.ts'
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
import { TracingLive } from './tracing.ts'

const AccordInputBusNoDeps = AccordInputBus.Default.pipe(
  Layer.withSpan('AccordInputBus.Default'),
)
const PatternInputBusNoDeps = PatternInputBus.Default.pipe(
  Layer.withSpan('PatternInputBus.Default'),
)
const StrengthInputBusNoDeps = StrengthInputBus.Default.pipe(
  Layer.withSpan('StrengthInputBus.Default'),
)

const AllBusesNoDeps = Layer.mergeAll(
  AccordInputBusNoDeps,
  PatternInputBusNoDeps,
  StrengthInputBusNoDeps,
).pipe(Layer.withSpan('AllBusesNoDeps'))

const AccordRegistryNoDeps = AccordRegistry.Default.pipe(
  Layer.withSpan('AccordRegistry.Default'),
)
const PatternRegistryNoDeps = PatternRegistry.Default.pipe(
  Layer.withSpan('PatternRegistry.Default'),
)
const StrengthRegistryNoDeps = StrengthRegistry.Default.pipe(
  Layer.withSpan('StrengthRegistry.Default'),
)

const AllRegistriesNoDeps = Layer.mergeAll(
  AccordRegistryNoDeps,
  PatternRegistryNoDeps,
  StrengthRegistryNoDeps,
).pipe(Layer.withSpan('AllRegistriesNoDeps'))

const AllRegistriesAndBusesNoDeps = Layer.mergeAll(
  AllBusesNoDeps,
  AllRegistriesNoDeps,
).pipe(Layer.withSpan('AllRegistriesAndBusesNoDeps'))

const MIDIAccessNoDeps = EMIDIAccess.layerSoftwareSynthSupported.pipe(
  Layer.catchAll(err =>
    Layer.effectDiscard(
      Effect.logError(
        `MIDI button to param button mapping failed because access wasn't granted and we cannot initialize pressure stream`,
        err,
      ),
    ),
  ),
  Layer.withSpan('EMIDIAccess.layerSoftwareSynthSupported'),
)

const SelectedMIDIInputWithAccessServiceNoDeps =
  SelectedMIDIInputService.Default.pipe(
    Layer.provideMerge(MIDIAccessNoDeps),
    Layer.withSpan('SelectedMIDIInputWithAccessServiceNoDeps'),
  )
// background
const KeyboardButtonMappingLayerNoDeps = KeyboardButtonMappingLayer.pipe(
  Layer.provide(AllRegistriesAndBusesNoDeps),
  Layer.withSpan('KeyboardButtonMappingLayerNoDeps'),
)
// background
const MIDIPadButtonMappingLayerNoDeps = MIDIPadButtonMappingLayer.pipe(
  Layer.provide(AllRegistriesAndBusesNoDeps),
  Layer.provide(SelectedMIDIInputWithAccessServiceNoDeps),
  Layer.withSpan('MIDIPadButtonMappingLayerNoDeps'),
)
// background
const OnScreenButtonMappingLayerNoDeps = OnScreenButtonMappingLayer.pipe(
  Layer.provide(AllRegistriesAndBusesNoDeps),
  Layer.withSpan('OnScreenButtonMappingLayerNoDeps'),
)

// background
const AllButtonMappingLayerNoDeps = Layer.mergeAll(
  KeyboardButtonMappingLayerNoDeps,
  MIDIPadButtonMappingLayerNoDeps,
  OnScreenButtonMappingLayerNoDeps,
).pipe(Layer.withSpan('AllButtonMappingLayerNoDeps'))

const RootDirectoryHandleNoDeps = RootDirectoryHandle.Default.pipe(
  Layer.withSpan('RootDirectoryHandleNoDeps'),
)

const LoadedAssetSizeEstimationMapNoDeps =
  LoadedAssetSizeEstimationMap.Default.pipe(
    Layer.provide(RootDirectoryHandleNoDeps),
    Layer.withSpan('LoadedAssetSizeEstimationMapNoDeps'),
  )

const OpfsWritableHandleManagerNoDeps = OpfsWritableHandleManager.Default.pipe(
  Layer.provide(LoadedAssetSizeEstimationMapNoDeps),
  Layer.provide(RootDirectoryHandleNoDeps),
  Layer.withSpan('OpfsWritableHandleManagerNoDeps'),
)

const CurrentlySelectedAssetStateNoDeps =
  CurrentlySelectedAssetState.Default.pipe(
    Layer.provide(AllRegistriesNoDeps),
    Layer.provide(LoadedAssetSizeEstimationMapNoDeps),
    Layer.withSpan('CurrentlySelectedAssetStateNoDeps'),
  )

const AppPlaybackStateServiceNoDeps = AppPlaybackStateService.Default.pipe(
  Layer.provide(AllRegistriesAndBusesNoDeps),
  Layer.provide(RootDirectoryHandleNoDeps),
  Layer.provide(CurrentlySelectedAssetStateNoDeps),
  Layer.provide(LoadedAssetSizeEstimationMapNoDeps),
  Layer.withSpan('AppPlaybackStateServiceNoDeps'),
)

const DownloadManagerNoDeps = DownloadManager.Default.pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(LoadedAssetSizeEstimationMapNoDeps),
  Layer.provide(OpfsWritableHandleManagerNoDeps),
  Layer.withSpan('DownloadManagerNoDeps'),
)

// background
const AssetDownloadSchedulerNoDeps = AssetDownloadSchedulerLive.pipe(
  Layer.provide(CurrentlySelectedAssetStateNoDeps),
  Layer.provide(DownloadManagerNoDeps),
  Layer.withSpan('AssetDownloadSchedulerNoDeps'),
)

const AccordParamButtonServiceNoDeps = AccordParamButtonService.Default.pipe(
  Layer.provide(AccordInputBusNoDeps),
  Layer.provide(AccordRegistryNoDeps),
  Layer.provide(CurrentlySelectedAssetStateNoDeps),
  Layer.provide(AppPlaybackStateServiceNoDeps),
  // Effect.provide(Layer.mergeAll()),
  Layer.withSpan('AccordParamButtonServiceNoDeps'),
)

const PatternParamButtonServiceNoDeps = PatternParamButtonService.Default.pipe(
  Layer.provide(PatternInputBusNoDeps),
  Layer.provide(PatternRegistryNoDeps),
  Layer.provide(CurrentlySelectedAssetStateNoDeps),
  Layer.provide(AppPlaybackStateServiceNoDeps),
  Layer.withSpan('PatternParamButtonServiceNoDeps'),
)

const StrengthParamButtonServiceNoDeps =
  StrengthParamButtonService.Default.pipe(
    Layer.provide(StrengthInputBusNoDeps),
    Layer.provide(StrengthRegistryNoDeps),
    Layer.provide(CurrentlySelectedAssetStateNoDeps),
    Layer.provide(AppPlaybackStateServiceNoDeps),
    Layer.withSpan('StrengthParamButtonServiceNoDeps'),
  )

const ParamButtonServiceNoDeps = Layer.mergeAll(
  AccordParamButtonServiceNoDeps,
  PatternParamButtonServiceNoDeps,
  StrengthParamButtonServiceNoDeps,
).pipe(Layer.withSpan('ParamButtonServiceNoDeps'))

const AppLayer = Layer.mergeAll(
  ParamButtonServiceNoDeps,
  AppPlaybackStateServiceNoDeps,
  AllButtonMappingLayerNoDeps,
  AssetDownloadSchedulerNoDeps,
).pipe(
  Layer.provideMerge(Logger.pretty),
  Layer.withSpan('AppLayer'),

  Layer.provide(TracingLive),
  // Layer.provideMerge(Logger.minimumLogLevel(LogLevel.Warning)),
)

Atom.runtime.addGlobalLayer(TracingLive)
const runtime = Atom.runtime(AppLayer)

// runtime.

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
