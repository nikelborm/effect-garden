import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'

import * as Atom from '@effect-atom/atom/Atom'
import * as Layer from 'effect/Layer'

import { AccordRegistry } from '../services/AccordRegistry.ts'
import { AppPlaybackStateService } from '../services/AppPlaybackStateService.ts'
import { LoadedAssetSizeEstimationMap } from '../services/LoadedAssetSizeEstimationMap.ts'
import { PatternRegistry } from '../services/PatternRegistry.ts'
import { PhysicalKeyboardButtonModelToAccordMappingService } from '../services/PhysicalKeyboardButtonModelToAccordMappingService.ts'
import { PhysicalKeyboardButtonModelToPatternMappingService } from '../services/PhysicalKeyboardButtonModelToPatternMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToAccordMappingService } from '../services/PhysicalMIDIDeviceButtonModelToAccordMappingService.ts'
import { PhysicalMIDIDeviceButtonModelToPatternMappingService } from '../services/PhysicalMIDIDeviceButtonModelToPatternMappingService.ts'
import { RootDirectoryHandle } from '../services/RootDirectoryHandle.ts'
import { SelectedMIDIInputService } from '../services/SelectedMIDIInputService.ts'
import { UIButtonService } from '../services/UIButtonService.ts'

const AppLayer = UIButtonService.Default.pipe(
  Layer.provideMerge(PhysicalKeyboardButtonModelToAccordMappingService.Default),
  Layer.provideMerge(
    PhysicalKeyboardButtonModelToPatternMappingService.Default,
  ),
  Layer.provideMerge(
    PhysicalMIDIDeviceButtonModelToAccordMappingService.Default,
  ),
  Layer.provideMerge(
    PhysicalMIDIDeviceButtonModelToPatternMappingService.Default,
  ),
  Layer.provideMerge(SelectedMIDIInputService.Default),
  Layer.provideMerge(EMIDIAccess.layerSoftwareSynthSupported),
  Layer.provideMerge(AppPlaybackStateService.Default),
  Layer.provideMerge(LoadedAssetSizeEstimationMap.Default),
  Layer.provideMerge(RootDirectoryHandle.Default),
  Layer.provideMerge(AccordRegistry.Default),
  Layer.provideMerge(PatternRegistry.Default),
  Layer.catchAll(err => {
    // if(err._tag === '')
    return Layer.empty
  }),
)

const runtime = Atom.runtime(AppLayer)
