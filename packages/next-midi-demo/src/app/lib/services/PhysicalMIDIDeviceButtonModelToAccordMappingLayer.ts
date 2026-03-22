import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import * as MIDIValues from '../branded/MIDIValues.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { AccordInputBus } from './InputStreamBus.ts'
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
export const PhysicalMIDIDeviceButtonModelToAccordMappingLayer =
  Layer.scopedDiscard(
    Effect.flatMap(AccordRegistry.allAccords, accords =>
      makePhysicalButtonToParamMappingService(
        noteDatasHandlingAccords,
        accords,
        makeMIDINoteButtonPressStream(notesHandlingAccordsSet),
        AccordInputBus,
      ),
    ),
  )
