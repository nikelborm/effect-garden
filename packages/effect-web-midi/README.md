# Effect Web MIDI API wrapper

Huge thanks to [Web MIDI spec](https://www.w3.org/TR/webmidi/)!

## TODO

1. tests ([useful example](https://chromium-review.googlesource.com/c/chromium/src/+/7242095/1/third_party/blink/web_tests/wpt_internal/webmidi/requestmidiaccess.https.html))

## Demo

```ts
'use client';
import { Atom, Result, useAtom, useAtomValue } from '@effect-atom/atom-react';
import { styled } from '@linaria/react';
import * as Cause from 'effect/Cause';
import * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import { flow, pipe } from 'effect/Function';
import * as Record from 'effect/Record';
import * as Stream from 'effect/Stream';
import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess';
import * as EMIDIInput from 'effect-web-midi/EMIDIInput';
import * as EMIDIOutput from 'effect-web-midi/EMIDIOutput';
import * as EMIDIPort from 'effect-web-midi/EMIDIPort';
import * as Parsing from 'effect-web-midi/Parsing';
import * as Util from 'effect-web-midi/Util';

const nanoPadInputId = EMIDIInput.Id(
  '380CB1F6BC0A21C5AAA0CDF95170A996937337454636CDDE223EEA6812283B07'
);

const nanoPadOutputId = EMIDIOutput.Id(
  '045297AACE044DA224B59E92DBC0E874160B85D0D43BE505CBB053747F4AA90A'
);

const globalDataDumpRequest = new Uint8Array([
  0xf0, 0x42, 0x40 /* 4g */,
  //
  0x00, 0x01, 0x03, 0x00,
  //
  0x1f, 0x0e, 0x00, 0xf7,
]);

const _MIDIDeviceConnectionEventsStringLog = pipe(
  // The lib supports both ways of working with access. You can either work with
  // its instance directly, or provide it through DI. All of the functions have
  // equivalents supporting both approaches. In this case we work with it directly
  EMIDIAccess.request(),
  //          ⬆️ Effect<
  //               EMIDIAccess.EMIDIAccessInstance,
  //               | AbortError
  //               | UnderlyingSystemError
  //               | MIDIAccessNotSupportedError
  //               | MIDIAccessNotAllowedError,
  //               never
  //             >
  Effect.catchTag(
    'MIDIAccessNotSupportedError',
    flow(Console.log, Effect.andThen(Effect.never))
  ),
  // notice that function below consumed access. It can consume access
  // regardless if it's wrapped in effect or not. It also has both
  // data-first and data-last signatures supported. Every function in this lib
  // conforms that rule
  EMIDIAccess.makeAllPortsStateChangesStream(),
  //          ⬆️ Stream<
  //               {
  //                 readonly _tag: "MIDIPortStateChange";
  //                 readonly cameFrom: EMIDIAccess.EMIDIAccessInstance;
  //                 readonly capturedAt: Date;
  //                 readonly newState: {
  //                   readonly ofDevice: MIDIPortDeviceState;
  //                   readonly ofConnection: MIDIPortConnectionState;
  //                 };
  //                 readonly port: EMIDIOutput | EMIDIInput;
  //               },
  //               | AbortError
  //               | UnderlyingSystemError
  //               | MIDIAccessNotAllowedError,
  //               never
  //             >
  // This is just a helper to render a list of objects to a string in nice-ish way
  Util.mapToGlidingStringLogOfLimitedEntriesCount(50, 'latestFirst', (_) => ({
    time: _.capturedAt.toISOString(),
    id: _.port.id.slice(-10),
    device: _.newState.ofDevice.padStart(12),
    connection: _.newState.ofConnection.padStart(7),
  }))
  // ⬆️ Stream<
  //      string,
  //      | AbortError
  //      | UnderlyingSystemError
  //      | MIDIAccessNotAllowedError,
  //      never
  //    >
);

const MIDIMessageEventsStringLog = pipe(
  // if the ID below turned out to be output's, it would cause defect (by design),
  // because messages can only come from inputs. Notice that instead of demanding
  // access from arguments, this particular method expects it to be provided in
  // requirements.
  EMIDIInput.makeMessagesStreamById(nanoPadInputId),
  //         ⬆️ Stream<
  //              {
  //                readonly _tag: "MIDIMessage";
  //                readonly cameFrom: EMIDIInput;
  //                readonly capturedAt: Date;
  //                readonly midiMessage: Uint8Array<ArrayBuffer>;
  //              },
  //              PortNotFoundError,
  //              EMIDIAccess
  //            >
  Parsing.withParsedDataField,
  //      ⬆️ Stream<
  //           {
  //             readonly _tag: "ParsedMIDIMessage";
  //             readonly cameFrom: EMIDIInput;
  //             readonly capturedAt: Date;
  //             readonly midiMessage: | NoteRelease
  //                                   | NotePress
  //                                   | UnknownReply
  //                                   | ControlChange
  //                                   | TouchpadRelease
  //                                   | PitchBendChange
  //           },
  //           PortNotFoundError,
  //           EMIDIAccess
  //         >
  // function below adds new member to the midiMessage union inferred from
  // ControlChange, PitchBendChange, and TouchpadRelease
  Parsing.withTouchpadPositionUpdates,
  Stream.filter(
    (a) =>
      a.midiMessage._tag === 'Touchpad Position Update' ||
      a.midiMessage._tag === 'Touchpad Release' ||
      a.midiMessage._tag === 'Note Press' ||
      a.midiMessage._tag === 'Note Release'
  ),
  // Just for the demo, show only select list of events
  Util.mapToGlidingStringLogOfLimitedEntriesCount(
    50,
    'latestFirst',
    (current) => ({
      time: current.capturedAt.toISOString(),
      id: current.cameFrom.id.slice(-10),
      ...current.midiMessage,
    })
  ),
  // ⬆️ Stream<string, PortNotFoundError, EMIDIAccess>
  Stream.catchTag('PortNotFound', (err) =>
    Stream.fromEffect(
      EMIDIPort.FullRecord.pipe(
        //      ⬆️ Effect<
        //           {
        //             [id: EMIDIPort.Id<'input'>]: EMIDIPort<'input'>
        //           } & {
        //             [id: EMIDIPort.Id<'output'>]: EMIDIPort<'output'>
        //           },
        //           never,
        //           EMIDIAccess.EMIDIAccess
        //         >
        Effect.map(
          Record.reduce(
            `Port with id=${err.portId} is not found. Currently available ports: \n`,
            (acc, { type, version, name }, id) =>
              acc + type.padEnd(7) + id + ' ' + version + ' ' + name + '\n'
          )
        ),
        Effect.flatMap(Console.log),
        Effect.andThen(
          `KORG nanoPAD not found in the list of connected devices`
        )
      )
    )
  ),
  // ⬆️ Stream.Stream<string, never, EMIDIAccess>
  Stream.provideLayer(EMIDIAccess.layerSystemExclusiveSupported),
  // ⬆️ Stream.Stream<
  //   string,
  //   | AbortError
  //   | UnderlyingSystemError
  //   | MIDIAccessNotSupportedError
  //   | MIDIAccessNotAllowedError,
  //   never
  // >
  Stream.catchTag('MIDIAccessNotSupportedError', (e) =>
    Stream.succeed(e.cause.message)
  )
);

const dumpRequester = Atom.fn(() =>
  // A particular example of methods flexibility. Here EMIDIAccess.send is a
  // data-first signature and accepts EMIDIAccess wrapped by Effect
  EMIDIAccess.send(
    EMIDIAccess.request({ sysex: true }),
    //          ⬆️ Effect.Effect<
    //                 EMIDIAccess.EMIDIAccessInstance,
    //                 | AbortError
    //                 | UnderlyingSystemError
    //                 | MIDIAccessNotAllowedError
    //                 | MIDIAccessNotSupportedError,
    //                 never
    //             >
    nanoPadOutputId,
    // ⬆️ string & Brand<"MIDIPortId"> & Brand<"output">
    globalDataDumpRequest
    // ⬆️ Uint8Array<ArrayBuffer>
  )
);

const textAtom = Atom.make(
  // MIDIDeviceConnectionEventsStringLog,
  MIDIMessageEventsStringLog
).pipe(Atom.keepAlive);

export default function Home() {
  const text = useAtomValue(textAtom);
  console.log(text);
  const [, mutate] = useAtom(dumpRequester);

  return (
    <Wrapper>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutate();
        }}
      >
        <input type='submit' value='dump' />
      </form>

      {Result.match(text, {
        onFailure: (_) => (
          <>
            failure:
            <br />
            {Cause.pretty(_.cause)}
          </>
        ),
        onInitial: (e) => <>initial waiting: {e.waiting.toString()}</>,
        onSuccess: (s) => <pre>{s.value}</pre>,
      })}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  color: wheat;
`;
```
