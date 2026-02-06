import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import * as Parsing from 'effect-web-midi/Parsing'

import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as Predicate from 'effect/Predicate'
import * as Stream from 'effect/Stream'

import * as MIDIValues from '../branded/MIDIValues.ts'
import { makePhysicalButtonToParamMappingService } from './makePhysicalButtonToParamMappingService.ts'
import { PatternRegistry } from './PatternRegistry.ts'
import { SelectedMIDIInputService } from './SelectedMIDIInputService.ts'

const notesHandlingPatterns = EArray.range(92, 99).map(MIDIValues.NoteId)

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
        Stream.map(makeMIDIDeviceSliceMapStream(notesHandlingPatterns), _ => [
          _.noteId,
          _.pressState,
        ]),
      ),
    ),
  },
) {}

const makeMIDIDeviceStream = () =>
  SelectedMIDIInputService.changes.pipe(
    Stream.unwrap,
    Stream.flatMap(inputId =>
      inputId ? EMIDIInput.makeMessagesStreamById(inputId) : Stream.empty,
    ),
    Stream.catchTag('PortNotFound', () =>
      Stream.dieMessage('it should not be possible to pass invalid id'),
    ),
    Parsing.withParsedDataField,
    Stream.filter(Predicate.or(Parsing.isNoteRelease, Parsing.isNotePress)),
  )

Stream.provideLayer(
          EMIDIAccess.layerSystemExclusiveAndSoftwareSynthSupported,
        ),
        Stream.tap(({ midiMessage }) =>
          Atom.set(setPhysicalMIDIPadButtonState, {
            midiPadPress:
              midiMessage._tag === 'Note Press'
                ? ButtonState.Pressed
                : ButtonState.NotPressed,
            physicalMIDIDeviceNote: MIDIValues.NoteId(midiMessage.note),
          }),
        ),
