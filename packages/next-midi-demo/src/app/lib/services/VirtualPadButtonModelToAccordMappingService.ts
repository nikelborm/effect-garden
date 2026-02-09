import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'

import * as MIDIValues from '../branded/MIDIValues.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'

const notesHandlingAccords = EArray.range(84, 91).map(MIDIValues.NoteId)
const notesHandlingAccordsSet = new Set(notesHandlingAccords)

// TODO: midi device selector
export class VirtualPadButtonModelToAccordMappingService extends Effect.Service<VirtualPadButtonModelToAccordMappingService>()(
  'next-midi-demo/VirtualPadButtonModelToAccordMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(AccordRegistry.allAccords, accords =>
      makePhysicalButtonToParamMappingService(
        MIDIValues.NoteIdOrder,
        notesHandlingAccords,
        accords,
        makeMIDINoteButtonPressStream(notesHandlingAccordsSet),
      ),
    ),
  },
) {
  static OnMIDIDisabled = Layer.succeed(
    this,
    this.make({
      currentMap: Effect.succeed(SortedMap.empty(MIDIValues.NoteIdOrder)),
      mapChanges: Stream.empty,
      getPhysicalButtonModel: () => Effect.succeedNone,
    }),
  )
}
