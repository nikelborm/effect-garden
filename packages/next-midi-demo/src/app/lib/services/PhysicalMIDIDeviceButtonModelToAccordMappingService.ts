import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'

import * as MIDIValues from '../branded/MIDIValues.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'

const notesHandlingAccords = EArray.range(84, 91).map(MIDIValues.NoteId)
const notesHandlingAccordsSet = new Set(notesHandlingAccords)

// TODO: midi device selector
export class PhysicalMIDIDeviceButtonModelToAccordMappingService extends Effect.Service<PhysicalMIDIDeviceButtonModelToAccordMappingService>()(
  'next-midi-demo/PhysicalMIDIDeviceButtonModelToAccordMappingService',
  {
    accessors: true,
    dependencies: [AccordRegistry.Default],
    scoped: Effect.flatMap(AccordRegistry.allAccords, accords =>
      makePhysicalButtonToParamMappingService(
        MIDIValues.NoteIdOrder,
        notesHandlingAccords,
        accords,
        makeMIDINoteButtonPressStream(notesHandlingAccordsSet),
      ),
    ),
  },
) {}
