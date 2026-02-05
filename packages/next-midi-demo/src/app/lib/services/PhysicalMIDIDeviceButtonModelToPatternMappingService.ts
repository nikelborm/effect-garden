import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'

import * as MIDIValues from '../branded/MIDIValues.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { PatternRegistry } from './PatternRegistry.ts'

const notesHandlingPatterns = EArray.range(92, 99).map(MIDIValues.NoteId)

// TODO: midi device selector
export class PhysicalMIDIDeviceButtonModelToPatternMappingService extends Effect.Service<PhysicalMIDIDeviceButtonModelToPatternMappingService>()(
  'next-midi-demo/PhysicalMIDIDeviceButtonModelToPatternMappingService',
  {
    accessors: true,
    dependencies: [PatternRegistry.Default],
    scoped: Effect.flatMap(PatternRegistry.allPatterns, Patterns =>
      makePhysicalButtonToParamMappingService(
        MIDIValues.NoteIdOrder,
        notesHandlingPatterns,
        Patterns,
        Stream.map(makeMIDIDeviceSliceMapStream(notesHandlingPatterns), _ => [
          _.noteId,
          _.pressState,
        ]),
      ),
    ),
  },
) {}
