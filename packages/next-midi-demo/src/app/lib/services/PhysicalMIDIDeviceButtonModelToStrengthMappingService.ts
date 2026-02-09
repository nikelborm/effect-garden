import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'

import * as MIDIValues from '../branded/MIDIValues.ts'
import { makeMIDINoteButtonPressStream } from '../helpers/makeMIDINoteButtonPressStream.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

const notesHandlingStrengths = EArray.range(76, 78).map(MIDIValues.NoteId)
const notesHandlingStrengthsSet = new Set(notesHandlingStrengths)

// TODO: midi device selector
export class PhysicalMIDIDeviceButtonModelToStrengthMappingService extends Effect.Service<PhysicalMIDIDeviceButtonModelToStrengthMappingService>()(
  'next-midi-demo/PhysicalMIDIDeviceButtonModelToStrengthMappingService',
  {
    accessors: true,
    scoped: Effect.flatMap(StrengthRegistry.allStrengths, strengths =>
      makePhysicalButtonToParamMappingService(
        MIDIValues.NoteIdOrder,
        notesHandlingStrengths,
        strengths,
        makeMIDINoteButtonPressStream(notesHandlingStrengthsSet),
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
