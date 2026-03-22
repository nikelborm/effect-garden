import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import * as MIDIValues from '../branded/MIDIValues.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { StrengthInputBus } from './InputStreamBus.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

const notes = EArray.range(76, 78)
const noteDatasHandlingStrengths = Array.from(
  notes,
  note => new MIDIValues.NoteIdData(note),
)
const notesHandlingStrengthsSet = new Set(
  noteDatasHandlingStrengths.map(_ => _.value),
)

// TODO: midi device selector
export const PhysicalMIDIDeviceButtonModelToStrengthMappingLayer =
  Layer.scopedDiscard(
    Effect.flatMap(StrengthRegistry.allStrengths, strengths =>
      makePhysicalButtonToParamMappingService(
        noteDatasHandlingStrengths,
        strengths,
        makeMIDINoteButtonPressStream(notesHandlingStrengthsSet),
        StrengthInputBus,
      ),
    ),
  )
