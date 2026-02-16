import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as HashMap from 'effect/HashMap'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import * as MIDIValues from '../branded/MIDIValues.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { PatternRegistry } from './PatternRegistry.ts'

const notes = EArray.range(92, 99)
const noteDatasHandlingPatterns = Array.from(
  notes,
  note => new MIDIValues.NoteIdData(note),
)
const notesHandlingPatternsSet = new Set(
  noteDatasHandlingPatterns.map(_ => _.value),
)

// TODO: midi device selector
export class PhysicalMIDIDeviceButtonModelToPatternMappingService extends Effect.Service<PhysicalMIDIDeviceButtonModelToPatternMappingService>()(
  'next-midi-demo/PhysicalMIDIDeviceButtonModelToPatternMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(PatternRegistry.allPatterns, patterns =>
      makePhysicalButtonToParamMappingService(
        noteDatasHandlingPatterns,
        patterns,
        makeMIDINoteButtonPressStream(notesHandlingPatternsSet),
      ),
    ),
  },
) {
  static OnMIDIDisabled = Layer.succeed(
    this,
    this.make({
      currentMap: Effect.succeed(HashMap.empty()),
      latestPhysicalButtonModelsStream: Stream.empty,
      mapChanges: Stream.empty,
      getPhysicalButtonModel: () => Effect.succeedNone,
    }),
  )
}
