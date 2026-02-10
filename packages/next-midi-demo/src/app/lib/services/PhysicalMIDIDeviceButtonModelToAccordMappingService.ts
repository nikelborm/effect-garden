import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'

import * as MIDIValues from '../branded/MIDIValues.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'

const notes = EArray.range(84, 91)
const noteDatasHandlingAccords = Array.from(
  notes,
  note => new MIDIValues.NoteIdData(note),
)
const notesHandlingAccordsSet = new Set(
  noteDatasHandlingAccords.map(_ => _.value),
)

// TODO: midi device selector
export class PhysicalMIDIDeviceButtonModelToAccordMappingService extends Effect.Service<PhysicalMIDIDeviceButtonModelToAccordMappingService>()(
  'next-midi-demo/PhysicalMIDIDeviceButtonModelToAccordMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(AccordRegistry.allAccords, accords =>
      makePhysicalButtonToParamMappingService(
        MIDIValues.NoteIdDataOrder,
        noteDatasHandlingAccords,
        accords,
        makeMIDINoteButtonPressStream(notesHandlingAccordsSet),
      ),
    ),
  },
) {
  static OnMIDIDisabled = Layer.succeed(
    this,
    this.make({
      currentMap: Effect.succeed(SortedMap.empty(MIDIValues.NoteIdDataOrder)),
      mapChanges: Stream.empty,
      getPhysicalButtonModel: () => Effect.succeedNone,
    }),
  )
}
