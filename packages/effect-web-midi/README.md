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

const _MIDIDeviceConnectionEventsStringLog = EMIDIAccess.request().pipe(
  Effect.catchTag(
    'MIDIAccessNotSupportedError',
    flow(Console.log, Effect.andThen(Effect.never))
  ),
  EMIDIAccess.makeAllPortsStateChangesStream(),
  Util.mapToGlidingStringLogOfLimitedEntriesCount(50, 'latestFirst', (_) => ({
    time: _.capturedAt.toISOString(),
    id: _.port.id.slice(-10),
    device: _.newState.ofDevice.padStart(12),
    connection: _.newState.ofConnection.padStart(7),
  }))
);

const MIDIMessageEventsStringLog = pipe(
  EMIDIInput.makeMessagesStreamById(nanoPadInputId),
  // if the ID above turned out to be output's, it would cause defect (by design)
  Parsing.withParsedDataField,
  Parsing.withTouchpadPositionUpdates,
  Stream.filter(
    (a) =>
      a.midiMessage._tag === 'Touchpad Position Update' ||
      a.midiMessage._tag === 'Touchpad Release' ||
      a.midiMessage._tag === 'Note Press' ||
      a.midiMessage._tag === 'Note Release'
  ),
  Util.mapToGlidingStringLogOfLimitedEntriesCount(
    50,
    'latestFirst',
    (current) => ({
      time: current.capturedAt.toISOString(),
      id: current.cameFrom.id.slice(-10),
      ...current.midiMessage,
    })
  ),
  Stream.catchTag('PortNotFound', (err) =>
    Stream.fromEffect(
      EMIDIPort.FullRecord.pipe(
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
  Stream.provideLayer(EMIDIAccess.layerSystemExclusiveSupported),
  Stream.catchTag('MIDIAccessNotSupportedError', (e) =>
    Stream.succeed(e.cause.message)
  )
);

const dumpRequester = Atom.fn(() =>
  EMIDIAccess.send(
    EMIDIAccess.request({ sysex: true }),
    // ^ Effect.Effect<
    //       EMIDIAccess.EMIDIAccessInstance,
    //       | AbortError
    //       | UnderlyingSystemError
    //       | MIDIAccessNotAllowedError
    //       | MIDIAccessNotSupportedError,
    //       never
    //   >
    nanoPadOutputId,
    // ^ string & Brand<"MIDIPortId"> & Brand<"output">
    globalDataDumpRequest
    // ^ Uint8Array<ArrayBuffer>
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
          console.log('hex', new FormData(event.target as any).get('hex'));
          mutate();
        }}
      >
        <input type='text' name='hex' />
        <input type='submit' value='send' />
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
