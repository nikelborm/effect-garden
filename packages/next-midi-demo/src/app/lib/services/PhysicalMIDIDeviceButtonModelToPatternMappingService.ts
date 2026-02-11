import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as SortedMap from 'effect/SortedMap'
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
        MIDIValues.NoteIdDataOrder,
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
      currentMap: Effect.succeed(SortedMap.empty(MIDIValues.NoteIdDataOrder)),
      latestPhysicalButtonModelsStream: Stream.empty,
      mapChanges: Stream.empty,
      getPhysicalButtonModel: () => Effect.succeedNone,
    }),
  )
}
