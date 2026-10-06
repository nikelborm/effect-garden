import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as EFunction from 'effect/Function'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
import * as AsyncResult from 'effect/reactivity/AsyncResult'
import * as Atom from 'effect/reactivity/Atom'
import * as Scope from 'effect/Scope'
// import * as LogLevel from 'effect/LogLevel'

import {
  type Accord,
  AccordParamButtonData,
  AllAccordsLayer,
  defaultAccord,
} from '../domain/Accord.ts'
import {
  AllPatternsLayer,
  type Pattern,
  PatternParamButtonData,
} from '../domain/Pattern.ts'
import {
  AllStrengthsLayer,
  defaultStrength,
  type Strength,
  StrengthParamButtonData,
} from '../domain/Strength.ts'
import {
  KeyboardButtonMappingLayer,
  MIDIPadButtonMappingLayer,
  OnScreenButtonMappingLayer,
} from '../services/AllPhysicalButtonsToAllParamButtonsAssignmentLayer.ts'
import {
  AppPlaybackStateService,
  AppPlaybackStateServiceLayer,
} from '../services/AppPlaybackStateService/AppPlaybackStateService.ts'
import { DisposePlaybackLayer } from '../services/AppPlaybackStateService/webAudioSideEffects/DisposePlayback.ts'
import { GetAudioNowLayer } from '../services/AppPlaybackStateService/webAudioSideEffects/GetAudioNow.ts'
import { RestoreFullVolumeLayer } from '../services/AppPlaybackStateService/webAudioSideEffects/RestoreFullVolume.ts'
import { ScheduleFadeOutLayer } from '../services/AppPlaybackStateService/webAudioSideEffects/ScheduleFadeOut.ts'
import { ScheduleIncomingPatternLayer } from '../services/AppPlaybackStateService/webAudioSideEffects/ScheduleIncomingPattern.ts'
import { StartFreshPlaybackLayer } from '../services/AppPlaybackStateService/webAudioSideEffects/StartFreshPlayback.ts'
import { AssetDownloadSchedulerLayer } from '../services/AssetDownloadScheduler.ts'
import { AudioBufferStoreLayer } from '../services/AudioBufferStore.ts'
import { DeferredAudioContextServiceLayer } from '../services/DeferredAudioContextService.ts'
import { DeferredMIDIAccessServiceLayer } from '../services/DeferredMIDIAccessService.ts'
import { DownloadManagerLayer } from '../services/DownloadManager.ts'
import {
  AccordInputBusLayer,
  PatternInputBusLayer,
  StrengthInputBusLayer,
} from '../services/InputStreamBus.ts'
import { LoadedAssetSizeEstimationMapLayer } from '../services/LoadedAssetSizeEstimationMap.ts'
import { OpfsWritableHandleManagerLayer } from '../services/OpfsWritableHandleManager.ts'
import {
  AccordParamButtonService,
  AccordParamButtonServiceLayer,
  PatternParamButtonService,
  PatternParamButtonServiceLayer,
  StrengthParamButtonService,
  StrengthParamButtonServiceLayer,
} from '../services/ParamButtonService.ts'
import { RootDirectoryHandleLayer } from '../services/RootDirectoryHandle.ts'
import { SelectedMIDIInputServiceLayer } from '../services/SelectedMIDIInputService.ts'
import { somebodyKillMe, TracingLive } from './tracing.ts'

const AccordInputBusNoDeps = AccordInputBusLayer.pipe(
  Layer.withSpan('AccordInputBusLayer'),
  Layer.satisfiesServicesType<never>(),
)
const PatternInputBusNoDeps = PatternInputBusLayer.pipe(
  Layer.withSpan('PatternInputBusLayer'),
  Layer.satisfiesServicesType<never>(),
)
const StrengthInputBusNoDeps = StrengthInputBusLayer.pipe(
  Layer.withSpan('StrengthInputBusLayer'),
  Layer.satisfiesServicesType<never>(),
)

const AllBusesNoDeps = Layer.mergeAll(
  AccordInputBusNoDeps,
  PatternInputBusNoDeps,
  StrengthInputBusNoDeps,
).pipe(Layer.withSpan('AllBusesNoDeps'), Layer.satisfiesServicesType<never>())

const AllAccordsNoDeps = AllAccordsLayer.pipe(
  Layer.satisfiesServicesType<never>(),
)
const AllPatternsNoDeps = AllPatternsLayer.pipe(
  Layer.satisfiesServicesType<never>(),
)
const AllStrengthsNoDeps = AllStrengthsLayer.pipe(
  Layer.satisfiesServicesType<never>(),
)

const AllConstantsNoDeps = Layer.mergeAll(
  AllAccordsNoDeps,
  AllPatternsNoDeps,
  AllStrengthsNoDeps,
).pipe(Layer.satisfiesServicesType<never>())

const AllConstantsAndBusesNoDeps = Layer.mergeAll(
  AllBusesNoDeps,
  AllConstantsNoDeps,
).pipe(
  Layer.withSpan('AllConstantsAndBusesNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

const DeferredMIDIAccessNoDeps = DeferredMIDIAccessServiceLayer.pipe(
  Layer.withSpan('DeferredMIDIAccessServiceLayer'),
  Layer.satisfiesServicesType<never>(),
)

const SelectedMIDIInputWithAccessServiceNoDeps =
  SelectedMIDIInputServiceLayer.pipe(
    Layer.provideMerge(DeferredMIDIAccessNoDeps),
    Layer.withSpan('SelectedMIDIInputWithAccessServiceNoDeps'),
    Layer.satisfiesServicesType<never>(),
  )
// background
const KeyboardButtonMappingLayerNoDeps = KeyboardButtonMappingLayer.pipe(
  Layer.provide(AllConstantsAndBusesNoDeps),
  Layer.withSpan('KeyboardButtonMappingLayerNoDeps'),
  Layer.satisfiesServicesType<never>(),
)
// background
const MIDIPadButtonMappingLayerNoDeps = MIDIPadButtonMappingLayer.pipe(
  Layer.provide(AllConstantsAndBusesNoDeps),
  Layer.provide(SelectedMIDIInputWithAccessServiceNoDeps),
  Layer.withSpan('MIDIPadButtonMappingLayerNoDeps'),
  Layer.satisfiesServicesType<never>(),
)
// background
const OnScreenButtonMappingLayerNoDeps = OnScreenButtonMappingLayer.pipe(
  Layer.provide(AllConstantsAndBusesNoDeps),
  Layer.withSpan('OnScreenButtonMappingLayerNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

// background
const AllButtonMappingLayerNoDeps = Layer.mergeAll(
  KeyboardButtonMappingLayerNoDeps,
  MIDIPadButtonMappingLayerNoDeps,
  OnScreenButtonMappingLayerNoDeps,
).pipe(
  Layer.withSpan('AllButtonMappingLayerNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

const RootDirectoryHandleNoDeps = RootDirectoryHandleLayer.pipe(
  Layer.withSpan('RootDirectoryHandleNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

const LoadedAssetSizeEstimationMapNoDeps =
  LoadedAssetSizeEstimationMapLayer.pipe(
    Layer.provide(RootDirectoryHandleNoDeps),
    Layer.provide(AllConstantsNoDeps),
    Layer.withSpan('LoadedAssetSizeEstimationMapNoDeps'),
    Layer.satisfiesServicesType<never>(),
  )

const OpfsWritableHandleManagerNoDeps = OpfsWritableHandleManagerLayer.pipe(
  Layer.provide(LoadedAssetSizeEstimationMapNoDeps),
  Layer.provide(RootDirectoryHandleNoDeps),
  Layer.withSpan('OpfsWritableHandleManagerNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

const DeferredAudioContextNoDeps = DeferredAudioContextServiceLayer.pipe(
  Layer.satisfiesServicesType<never>(),
)

const AudioBufferStoreNoDeps = AudioBufferStoreLayer.pipe(
  Layer.provide(DeferredAudioContextNoDeps),
  Layer.provide(RootDirectoryHandleNoDeps),
  Layer.provide(LoadedAssetSizeEstimationMapNoDeps),
  Layer.satisfiesServicesType<never>(),
)

// Every WebAudio side effect the playback state machine
// (AppPlaybackStateService/types/loopElements.ts + advancePlayback/) can
// perform, each scoped to at most one playback. Tests provide their own
// per-tag spy layers instead of this one.
const WebAudioSideEffectsNoDeps = Layer.mergeAll(
  DisposePlaybackLayer,
  GetAudioNowLayer,
  RestoreFullVolumeLayer,
  ScheduleFadeOutLayer,
  ScheduleIncomingPatternLayer,
  StartFreshPlaybackLayer,
).pipe(
  Layer.provide(DeferredAudioContextNoDeps),
  Layer.withSpan('WebAudioSideEffectsNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

const AppPlaybackStateServiceNoDeps = AppPlaybackStateServiceLayer.pipe(
  // TODO: research why DeferredAudioContextNoDeps no longer needed here. This
  // might come back after uncommenting code there
  // Layer.provide(DeferredAudioContextNoDeps),
  Layer.provide(AudioBufferStoreNoDeps),
  Layer.provide(AllBusesNoDeps),
  Layer.provide(WebAudioSideEffectsNoDeps),
  Layer.withSpan('AppPlaybackStateServiceNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

const DownloadManagerNoDeps = DownloadManagerLayer.pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(LoadedAssetSizeEstimationMapNoDeps),
  Layer.provide(OpfsWritableHandleManagerNoDeps),
  Layer.withSpan('DownloadManagerNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

// background
const AssetDownloadSchedulerNoDeps = AssetDownloadSchedulerLayer.pipe(
  Layer.provide(DownloadManagerNoDeps),
  Layer.withSpan('AssetDownloadSchedulerNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

const AccordParamButtonServiceNoDeps = AccordParamButtonServiceLayer.pipe(
  Layer.provide(AccordInputBusNoDeps),
  Layer.provide(AppPlaybackStateServiceNoDeps),
  Layer.withSpan('AccordParamButtonServiceNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

const PatternParamButtonServiceNoDeps = PatternParamButtonServiceLayer.pipe(
  Layer.provide(PatternInputBusNoDeps),
  Layer.provide(AppPlaybackStateServiceNoDeps),
  Layer.withSpan('PatternParamButtonServiceNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

const StrengthParamButtonServiceNoDeps = StrengthParamButtonServiceLayer.pipe(
  Layer.provide(StrengthInputBusNoDeps),
  Layer.provide(AppPlaybackStateServiceNoDeps),
  Layer.withSpan('StrengthParamButtonServiceNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

const ParamButtonServiceNoDeps = Layer.mergeAll(
  AccordParamButtonServiceNoDeps,
  PatternParamButtonServiceNoDeps,
  StrengthParamButtonServiceNoDeps,
).pipe(
  Layer.withSpan('ParamButtonServiceNoDeps'),
  Layer.satisfiesServicesType<never>(),
)

export const AppLayer = Layer.mergeAll(
  ParamButtonServiceNoDeps,
  AppPlaybackStateServiceNoDeps,
  AllButtonMappingLayerNoDeps,
  AssetDownloadSchedulerNoDeps,
).pipe(
  Layer.provideMerge(Logger.layer([Logger.consolePrettyBrowser()])),
  Layer.withSpan('AppLayer'),
  Layer.provide(TracingLive),
  Layer.satisfiesServicesType<never>(),
  // Layer.provideMerge(Logger.minimumLogLevel(LogLevel.Warning)),
)

const builtRuntime = Atom.runtime(AppLayer)

// BrowserRuntime.runMain
export const testAtom = builtRuntime.atom(() =>
  Effect.gen(function* () {
    // TODO: verify the actual internal scope is acquired
    const scope = (yield* Effect.scope) as Scope.Closeable

    yield* Effect.sync(() => {
      global.window.addEventListener(
        'beforeunload',
        () => {
          // There's zero actual guarantees it will work, but we are small
          // people, we're happy with what we have and doing our best when we
          // can
          somebodyKillMe?.forceFlush()

          // @effect-diagnostics-next-line globalConsole:off
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
    s =>
      builtRuntime.atom(s, {
        initialValue: accord === defaultAccord,
      }),
    Atom.withFallback(
      Atom.readable(() =>
        AsyncResult.success(accord === defaultAccord, { waiting: true }),
      ),
    ),
    Atom.withServerValue(
      EFunction.constant(
        AsyncResult.success(accord === defaultAccord, { waiting: true }),
      ),
    ),
  ),
)

export const isPatternSelectedAtom = Atom.family((pattern: Pattern) =>
  EFunction.pipe(
    pattern,
    PatternParamButtonData.make,
    PatternParamButtonService.getIsSelectedStream,
    s =>
      builtRuntime.atom(s, {
        initialValue: false,
      }),
    Atom.withFallback(
      Atom.readable(() => AsyncResult.success(false, { waiting: true })),
    ),
    Atom.withServerValue(
      EFunction.constant(AsyncResult.success(false, { waiting: true })),
    ),
  ),
)

export const isStrengthSelectedAtom = Atom.family((strength: Strength) =>
  EFunction.pipe(
    strength,
    StrengthParamButtonData.make,
    StrengthParamButtonService.getIsSelectedStream,
    s =>
      builtRuntime.atom(s, {
        initialValue: strength === defaultStrength,
      }),
    Atom.withFallback(
      Atom.readable(() =>
        AsyncResult.success(strength === defaultStrength, { waiting: true }),
      ),
    ),
    Atom.withServerValue(
      EFunction.constant(
        AsyncResult.success(strength === defaultStrength, { waiting: true }),
      ),
    ),
  ),
)

export const isAccordPressedAtom = Atom.family((accord: Accord) =>
  EFunction.pipe(
    accord,
    AccordParamButtonData.make,
    AccordParamButtonService.isPressedFlagChangesStream,
    s =>
      builtRuntime.atom(s, {
        initialValue: false,
      }),
    Atom.withFallback(
      Atom.readable(() => AsyncResult.success(false, { waiting: true })),
    ),
    Atom.withServerValue(
      EFunction.constant(AsyncResult.success(false, { waiting: true })),
    ),
  ),
)

export const isPatternPressedAtom = Atom.family((pattern: Pattern) =>
  EFunction.pipe(
    pattern,
    PatternParamButtonData.make,
    PatternParamButtonService.isPressedFlagChangesStream,
    s =>
      builtRuntime.atom(s, {
        initialValue: false,
      }),
    Atom.withFallback(
      Atom.readable(() => AsyncResult.success(false, { waiting: true })),
    ),
    Atom.withServerValue(
      EFunction.constant(AsyncResult.success(false, { waiting: true })),
    ),
  ),
)

export const isStrengthPressedAtom = Atom.family((strength: Strength) =>
  EFunction.pipe(
    strength,
    StrengthParamButtonData.make,
    StrengthParamButtonService.isPressedFlagChangesStream,
    s =>
      builtRuntime.atom(s, {
        initialValue: false,
      }),
    Atom.withFallback(
      Atom.readable(() => AsyncResult.success(false, { waiting: true })),
    ),
    Atom.withServerValue(
      EFunction.constant(AsyncResult.success(false, { waiting: true })),
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
      s =>
        builtRuntime.atom(s, {
          initialValue: false,
        }),
      Atom.withFallback(
        Atom.readable(() => AsyncResult.success(false, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(AsyncResult.success(false, { waiting: true })),
      ),
    ),
)

export const isPatternButtonCurrentlyPlayingAtom = Atom.family(
  (pattern: Pattern) =>
    EFunction.pipe(
      pattern,
      PatternParamButtonData.make,
      PatternParamButtonService.getIsPlayingStream,
      s =>
        builtRuntime.atom(s, {
          initialValue: false,
        }),
      Atom.withFallback(
        Atom.readable(() => AsyncResult.success(false, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(AsyncResult.success(false, { waiting: true })),
      ),
    ),
)

export const isStrengthButtonCurrentlyPlayingAtom = Atom.family(
  (strength: Strength) =>
    EFunction.pipe(
      strength,
      StrengthParamButtonData.make,
      StrengthParamButtonService.getIsPlayingStream,
      s =>
        builtRuntime.atom(s, {
          initialValue: false,
        }),
      Atom.withFallback(
        Atom.readable(() => AsyncResult.success(false, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(AsyncResult.success(false, { waiting: true })),
      ),
    ),
)

export const accordButtonDownloadPercentAtom = Atom.family((accord: Accord) =>
  EFunction.pipe(
    accord,
    AccordParamButtonData.make,
    AccordParamButtonService.getDownloadPercent,
    s =>
      builtRuntime.atom(s, {
        initialValue: 0,
      }),
    Atom.withFallback(
      Atom.readable(() => AsyncResult.success(0, { waiting: true })),
    ),
    Atom.withServerValue(
      EFunction.constant(AsyncResult.success(0, { waiting: true })),
    ),
  ),
)

export const patternButtonDownloadPercentAtom = Atom.family(
  (pattern: Pattern) =>
    EFunction.pipe(
      pattern,
      PatternParamButtonData.make,
      PatternParamButtonService.getDownloadPercent,
      s =>
        builtRuntime.atom(s, {
          initialValue: 0,
        }),
      Atom.withFallback(
        Atom.readable(() => AsyncResult.success(0, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(AsyncResult.success(0, { waiting: true })),
      ),
    ),
)

export const strengthButtonDownloadPercentAtom = Atom.family(
  (strength: Strength) =>
    EFunction.pipe(
      strength,
      StrengthParamButtonData.make,
      StrengthParamButtonService.getDownloadPercent,
      s =>
        builtRuntime.atom(s, {
          initialValue: 0,
        }),
      Atom.withFallback(
        Atom.readable(() => AsyncResult.success(0, { waiting: true })),
      ),
      Atom.withServerValue(
        EFunction.constant(AsyncResult.success(0, { waiting: true })),
      ),
    ),
)

export const isPlayStopButtonPressableAtom = EFunction.pipe(
  AppPlaybackStateService.playStopButtonPressableFlagChangesStream,
  s =>
    builtRuntime.atom(s, {
      initialValue: false,
    }),
  Atom.withFallback(
    Atom.readable(() => AsyncResult.success(false, { waiting: true })),
  ),
  Atom.withServerValue(
    EFunction.constant(AsyncResult.success(false, { waiting: true })),
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
//       Effect.tapCause(Effect.logError),
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
