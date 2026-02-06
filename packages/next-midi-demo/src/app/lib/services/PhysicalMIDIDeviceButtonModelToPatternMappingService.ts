import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'

import * as MIDIValues from '../branded/MIDIValues.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { PatternRegistry } from './PatternRegistry.ts'
import { SelectedMIDIInputService } from './SelectedMIDIInputService.ts'

const notesHandlingPatterns = EArray.range(92, 99).map(MIDIValues.NoteId)
const notesHandlingPatternsSet = new Set(notesHandlingPatterns)

// TODO: midi device selector
export class PhysicalMIDIDeviceButtonModelToPatternMappingService extends Effect.Service<PhysicalMIDIDeviceButtonModelToPatternMappingService>()(
  'next-midi-demo/PhysicalMIDIDeviceButtonModelToPatternMappingService',
  {
    accessors: true,
    dependencies: [PatternRegistry.Default, SelectedMIDIInputService.Default],
    scoped: Effect.flatMap(PatternRegistry.allPatterns, patterns =>
      makePhysicalButtonToParamMappingService(
        MIDIValues.NoteIdOrder,
        notesHandlingPatterns,
        patterns,
        makeMIDINoteButtonPressStream(notesHandlingPatternsSet),
      ),
    ),
  },
) {}
