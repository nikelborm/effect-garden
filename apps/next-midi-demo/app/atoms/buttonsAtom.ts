import { EAudioContext } from 'effect-web-audio'
import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'

import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as Atom from '@effect-atom/atom/Atom'
import * as Result from '@effect-atom/atom/Result'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
import * as Scope from 'effect/Scope'
// import * as LogLevel from 'effect/LogLevel'
import * as Stream from 'effect/Stream'

import {
  type Accord,
  AccordParamButtonData,
  AllAccords,
  defaultAccord,
} from '../domain/Accord.ts'
import {
  AllPatterns,
  type Pattern,
  PatternParamButtonData,
} from '../domain/Pattern.ts'
import {
  AllStrengths,
  defaultStrength,
  type Strength,
  StrengthParamButtonData,
} from '../domain/Strength.ts'
import {
  KeyboardButtonMappingLayer,
  MIDIPadButtonMappingLayer,
  OnScreenButtonMappingLayer,
} from '../services/AllPhysicalButtonsToAllParamButtonsAssignmentLayer.ts'
import { AppPlaybackStateService } from '../services/AppPlaybackStateService/AppPlaybackStateService.ts'
import { AssetDownloadSchedulerLive } from '../services/AssetDownloadScheduler.ts'
import { AudioBufferStore } from '../services/AudioBufferStore.ts'
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
import { RootDirectoryHandle } from '../services/RootDirectoryHandle.ts'
import { SelectedMIDIInputService } from '../services/SelectedMIDIInputService.ts'
import { somebodyKillMe, TracingLive } from './tracing.ts'

const AccordInputBusNoDeps = AccordInputBus.Default.pipe(
  Layer.withSpan('AccordInputBus.Default'),
  Layer.ensureRequirementsType<never>(),
)
const PatternInputBusNoDeps = PatternInputBus.Default.pipe(
  Layer.withSpan('PatternInputBus.Default'),
  Layer.ensureRequirementsType<never>(),
)
const StrengthInputBusNoDeps = StrengthInputBus.Default.pipe(
  Layer.withSpan('StrengthInputBus.Default'),
  Layer.ensureRequirementsType<never>(),
)

const AllBusesNoDeps = Layer.mergeAll(
  AccordInputBusNoDeps,
  PatternInputBusNoDeps,
  StrengthInputBusNoDeps,
).pipe(Layer.withSpan('AllBusesNoDeps'), Layer.ensureRequirementsType<never>())

const AllAccordsNoDeps = AllAccords.Default.pipe(
  Layer.ensureRequirementsType<never>(),
)
const AllPatternsNoDeps = AllPatterns.Default.pipe(
  Layer.ensureRequirementsType<never>(),
)
const AllStrengthsNoDeps = AllStrengths.Default.pipe(
  Layer.ensureRequirementsType<never>(),
)

const AllConstantsNoDeps = Layer.mergeAll(
  AllAccordsNoDeps,
  AllPatternsNoDeps,
  AllStrengthsNoDeps,
).pipe(Layer.ensureRequirementsType<never>())

const AllConstantsAndBusesNoDeps = Layer.mergeAll(
  AllBusesNoDeps,
  AllConstantsNoDeps,
).pipe(
  Layer.withSpan('AllConstantsAndBusesNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

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
  Layer.ensureRequirementsType<never>(),
)

const SelectedMIDIInputWithAccessServiceNoDeps =
  SelectedMIDIInputService.Default.pipe(
    Layer.provideMerge(MIDIAccessNoDeps),
    Layer.withSpan('SelectedMIDIInputWithAccessServiceNoDeps'),
    Layer.ensureRequirementsType<never>(),
  )
// background
const KeyboardButtonMappingLayerNoDeps = KeyboardButtonMappingLayer.pipe(
  Layer.provide(AllConstantsAndBusesNoDeps),
  Layer.withSpan('KeyboardButtonMappingLayerNoDeps'),
  Layer.ensureRequirementsType<never>(),
)
// background
const MIDIPadButtonMappingLayerNoDeps = MIDIPadButtonMappingLayer.pipe(
  Layer.provide(AllConstantsAndBusesNoDeps),
  Layer.provide(SelectedMIDIInputWithAccessServiceNoDeps),
  Layer.withSpan('MIDIPadButtonMappingLayerNoDeps'),
  Layer.ensureRequirementsType<never>(),
)
// background
const OnScreenButtonMappingLayerNoDeps = OnScreenButtonMappingLayer.pipe(
  Layer.provide(AllConstantsAndBusesNoDeps),
  Layer.withSpan('OnScreenButtonMappingLayerNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

// background
const AllButtonMappingLayerNoDeps = Layer.mergeAll(
  KeyboardButtonMappingLayerNoDeps,
  MIDIPadButtonMappingLayerNoDeps,
  OnScreenButtonMappingLayerNoDeps,
).pipe(
  Layer.withSpan('AllButtonMappingLayerNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

const RootDirectoryHandleNoDeps = RootDirectoryHandle.Default.pipe(
  Layer.withSpan('RootDirectoryHandleNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

const LoadedAssetSizeEstimationMapNoDeps =
  LoadedAssetSizeEstimationMap.Default.pipe(
    Layer.provide(RootDirectoryHandleNoDeps),
    Layer.provide(AllConstantsNoDeps),
    Layer.withSpan('LoadedAssetSizeEstimationMapNoDeps'),
    Layer.ensureRequirementsType<never>(),
  )

const OpfsWritableHandleManagerNoDeps = OpfsWritableHandleManager.Default.pipe(
  Layer.provide(LoadedAssetSizeEstimationMapNoDeps),
  Layer.provide(RootDirectoryHandleNoDeps),
  Layer.withSpan('OpfsWritableHandleManagerNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

const AudioContextLive = EAudioContext.layer().pipe(
  Layer.orDie,
  Layer.ensureRequirementsType<never>(),
)

const AudioBufferStoreNoDeps = AudioBufferStore.Live.pipe(
  Layer.provide(AudioContextLive),
  Layer.provide(RootDirectoryHandleNoDeps),
  Layer.provide(LoadedAssetSizeEstimationMapNoDeps),
  Layer.ensureRequirementsType<never>(),
)

const AppPlaybackStateServiceNoDeps = AppPlaybackStateService.Default.pipe(
  Layer.provide(AudioContextLive),
  Layer.provide(AudioBufferStoreNoDeps),
  Layer.provide(AllBusesNoDeps),
  Layer.withSpan('AppPlaybackStateServiceNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

const DownloadManagerNoDeps = DownloadManager.Default.pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(LoadedAssetSizeEstimationMapNoDeps),
  Layer.provide(OpfsWritableHandleManagerNoDeps),
  Layer.withSpan('DownloadManagerNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

// background
const AssetDownloadSchedulerNoDeps = AssetDownloadSchedulerLive.pipe(
  Layer.provide(DownloadManagerNoDeps),
  Layer.withSpan('AssetDownloadSchedulerNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

const AccordParamButtonServiceNoDeps = AccordParamButtonService.Default.pipe(
  Layer.provide(AccordInputBusNoDeps),
  Layer.provide(AppPlaybackStateServiceNoDeps),
  Layer.withSpan('AccordParamButtonServiceNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

const PatternParamButtonServiceNoDeps = PatternParamButtonService.Default.pipe(
  Layer.provide(PatternInputBusNoDeps),
  Layer.provide(AppPlaybackStateServiceNoDeps),
  Layer.withSpan('PatternParamButtonServiceNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

const StrengthParamButtonServiceNoDeps =
  StrengthParamButtonService.Default.pipe(
    Layer.provide(StrengthInputBusNoDeps),
    Layer.provide(AppPlaybackStateServiceNoDeps),
    Layer.withSpan('StrengthParamButtonServiceNoDeps'),
    Layer.ensureRequirementsType<never>(),
  )

const ParamButtonServiceNoDeps = Layer.mergeAll(
  AccordParamButtonServiceNoDeps,
  PatternParamButtonServiceNoDeps,
  StrengthParamButtonServiceNoDeps,
).pipe(
  Layer.withSpan('ParamButtonServiceNoDeps'),
  Layer.ensureRequirementsType<never>(),
)

export const AppLayer = Layer.mergeAll(
  ParamButtonServiceNoDeps,
  AppPlaybackStateServiceNoDeps,
  AllButtonMappingLayerNoDeps,
  AssetDownloadSchedulerNoDeps,
).pipe(
  Layer.provideMerge(Logger.pretty),
  Layer.withSpan('AppLayer'),

  Layer.provide(TracingLive),
  Layer.ensureRequirementsType<never>(),
  // Layer.provideMerge(Logger.minimumLogLevel(LogLevel.Warning)),
)

const builtRuntime = Atom.runtime(AppLayer)

// BrowserRuntime.runMain
export const testAtom = builtRuntime.atom(() =>
  Effect.gen(function* () {
    // const scope = (yield* Effect.scope) as Scope.CloseableScope

    const innerRuntime = yield* Effect.runtime()

    const scope = innerRuntime.context.unsafeMap.get(
      Scope.Scope.key,
    ) as Scope.CloseableScope

    yield* Effect.sync(() => {
      global.window.addEventListener(
        'beforeunload',
        () => {
          // There's zero actual guarantees it will work, but we are small
          // people, we're happy with what we have and doing our best when we
          // can
          somebodyKillMe?.forceFlush()

          console.log(Effect.runSyncExit(Scope.close(scope, Exit.void)))
        },
        { once: true },
      )
    })
  }),
)

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
//     s =>
//       runtime.atom(s, {
//         initialValue: Option.isSome(pattern),
//       }),
//     Atom.withFallback(
//       Atom.readable(() =>
//         Result.success(Option.isSome(pattern), { waiting: true }),
//       ),
//     ),
//     Atom.withServerValue(
//       EFunction.constant(
//         Result.success(Option.isSome(pattern), { waiting: true }),
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
      builtRuntime.atom(s, {
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
      builtRuntime.atom(s, {
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
      builtRuntime.atom(s, {
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
      builtRuntime.atom(s, {
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
      builtRuntime.atom(s, {
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
      builtRuntime.atom(s, {
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

// "Currently playing" = this button's value is part of whatever is actually
// sounding right now (a loop stays playing while it fades out). Initial state
// is Silence, so nothing plays yet.
export const isAccordButtonCurrentlyPlayingAtom = Atom.family(
  (accord: Accord) =>
    EFunction.pipe(
      accord,
      AccordParamButtonData.make,
      AccordParamButtonService.getIsPlayingStream,
      Stream.unwrap,
      s =>
        builtRuntime.atom(s, {
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
  (pattern: Pattern) =>
    EFunction.pipe(
      pattern,
      PatternParamButtonData.make,
      PatternParamButtonService.getIsPlayingStream,
      Stream.unwrap,
      s =>
        builtRuntime.atom(s, {
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
      StrengthParamButtonData.make,
      StrengthParamButtonService.getIsPlayingStream,
      Stream.unwrap,
      s =>
        builtRuntime.atom(s, {
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

export const accordButtonDownloadPercentAtom = Atom.family((accord: Accord) =>
  EFunction.pipe(
    accord,
    AccordParamButtonData.make,
    AccordParamButtonService.getDownloadPercent,
    Stream.unwrap,
    s =>
      builtRuntime.atom(s, {
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
        builtRuntime.atom(s, {
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
        builtRuntime.atom(s, {
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
    builtRuntime.atom(s, {
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
