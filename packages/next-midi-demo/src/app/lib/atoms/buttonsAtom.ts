import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'

import * as Atom from '@effect-atom/atom/Atom'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import { AccordRegistry } from '../services/AccordRegistry.ts'
import { AppPlaybackStateService } from '../services/AppPlaybackStateService.ts'
import { CurrentlySelectedAssetState } from '../services/CurrentlySelectedAssetState.ts'
import { LoadedAssetSizeEstimationMap } from '../services/LoadedAssetSizeEstimationMap.ts'
import { PatternRegistry } from '../services/PatternRegistry.ts'
import { PhysicalKeyboardButtonModelToAccordMappingService } from '../services/PhysicalKeyboardButtonModelToAccordMappingService.ts'
import { PhysicalKeyboardButtonModelToPatternMappingService } from '../services/PhysicalKeyboardButtonModelToPatternMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToAccordMappingService } from '../services/PhysicalMIDIDeviceButtonModelToAccordMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToPatternMappingService } from '../services/PhysicalMIDIDeviceButtonModelToPatternMappingService.ts'
import { RootDirectoryHandle } from '../services/RootDirectoryHandle.ts'
import { SelectedMIDIInputService } from '../services/SelectedMIDIInputService.ts'
import { StrengthRegistry } from '../services/StrengthRegistry.ts'
import { UIButtonService } from '../services/UIButtonService.ts'

const MIDIButtonMappingsLayer = EFunction.pipe(
  PhysicalMIDIDeviceButtonModelToAccordMappingService.Default,
  Layer.merge(PhysicalMIDIDeviceButtonModelToPatternMappingService.Default),
  Layer.provide(SelectedMIDIInputService.Default),
  Layer.provide(EMIDIAccess.layerSoftwareSynthSupported),
  Layer.catchAll(midiAccessErr =>
    Layer.mergeAll(
      Layer.effectDiscard(
        Effect.log('Error while acquiring MIDI access', midiAccessErr),
      ),
      PhysicalMIDIDeviceButtonModelToAccordMappingService.OnMIDIDisabled,
      PhysicalMIDIDeviceButtonModelToPatternMappingService.OnMIDIDisabled,
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
  Layer.provide(PhysicalKeyboardButtonModelToAccordMappingService.Default),
  Layer.provide(PhysicalKeyboardButtonModelToPatternMappingService.Default),

  Layer.provide(MIDIButtonMappingsLayer),
  Layer.provide(AppPlaybackStateService.Default),
  Layer.provide(CurrentlySelectedAssetState.Default),
  Layer.provide(LoadedAssetSizeEstimationMap.Default),
  Layer.provide(RootDirectoryHandle.Default),
  Layer.provide(AccordRegistry.Default),
  Layer.provide(PatternRegistry.Default),
  Layer.provide(StrengthRegistry.Default),
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
