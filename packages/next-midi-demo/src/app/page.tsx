/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'
import { Atom, Result, useAtom, useAtomValue } from '@effect-atom/atom-react'
import { styled } from '@linaria/react'
import * as Cause from 'effect/Cause'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import { flow, pipe } from 'effect/Function'
import * as Predicate from 'effect/Predicate'
import * as Record from 'effect/Record'
import * as Stream from 'effect/Stream'
import * as Tuple from 'effect/Tuple'
import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import * as EMIDIOutput from 'effect-web-midi/EMIDIOutput'
import * as EMIDIPort from 'effect-web-midi/EMIDIPort'
import * as Parsing from 'effect-web-midi/Parsing'
import * as Util from 'effect-web-midi/Util'

const [
  midiInputThroughPort0,
  launchpadInputDAW,
  launchpadInputMidi,
  nanoPadInputId,
] = Tuple.map(
  [
    '1A0CE1F47C19C43DAEB93B9595F6E4BA822ED318FE8D8BF2750B66286B5BEC38',
    'FDF783BD3DC9860327B87A57E233D98FE989F6BBD5772B162485849ECBCF7723',
    'A3008DE411F375E270B506F5BA840A8ED818A8F7A755575A73DF1C3B772E60DD',
    '380CB1F6BC0A21C5AAA0CDF95170A996937337454636CDDE223EEA6812283B07',
  ],
  EMIDIInput.Id,
)

const [
  midiOutputThroughPort0,
  launchpadOutputDAW,
  launchpadOutputMidi,
  nanoPadOutputId,
] = Tuple.map(
  [
    '6FF5590044F4859ED50C5167BCFE9700A1798E39AA55A628E86D39011FAECD5D',
    'C79398E0D0DFED4614A071E8339DED7861331D5DC404CD0CB145ED0C85ED23B9',
    'C1666E3E80830F9EE44DFC6447B613D6BF98E08599E8782226034EA0D6AEA3A8',
    '045297AACE044DA224B59E92DBC0E874160B85D0D43BE505CBB053747F4AA90A',
  ],
  EMIDIOutput.Id,
)

const globalDataDumpRequest = new Uint8Array([
  0xf0, 0x42, 0x40 /* 4g */,
  //
  0x00, 0x01, 0x03, 0x00,
  //
  0x1f, 0x0e, 0x00, 0xf7,
])

const _MIDIDeviceConnectionEventsStringLog = pipe(
  EMIDIAccess.request(),
  Effect.catchTag(
    'MIDIAccessNotSupportedError',
    flow(Console.log, Effect.andThen(Effect.never)),
  ),
  EMIDIAccess.makeAllPortsStateChangesStream(),
  Util.mapToGlidingStringLogOfLimitedEntriesCount(50, 'latestFirst', _ => ({
    time: _.capturedAt.toISOString(),
    id: _.port.id.slice(-10),
    device: _.newState.ofDevice.padStart(12),
    connection: _.newState.ofConnection.padStart(7),
  })),
)

const MIDIMessageEventsStringLog = pipe(
  EMIDIInput.makeMessagesStreamById(launchpadInputMidi, {}),
  // Stream.map(e => ({ ...e })),
  Parsing.withParsedDataField,
  Stream.map(e => e),
  e => e,
  Parsing.withTouchpadPositionUpdates,
  Stream.filter(Predicate.or(Parsing.isChannelPressure, Parsing.isNotePress)),
  Stream.map(e => ({ ...e })),
  e => e,
  Util.mapToGlidingStringLogOfLimitedEntriesCount(
    50,
    'latestFirst',
    current => ({
      time: current.capturedAt.toISOString(),
      id: current.cameFrom.id.slice(-10),
      ...current.midiMessage,
    }),
  ),
  Stream.catchTag('PortNotFound', err =>
    Stream.fromEffect(
      EMIDIPort.FullRecord.pipe(
        Effect.map(
          Record.reduce(
            `Port with id=${err.portId} is not found. Currently available ports: \n`,
            (acc, { type, version, name }, id) =>
              acc + type.padEnd(7) + id + ' ' + version + ' ' + name + '\n',
          ),
        ),
        Effect.flatMap(Console.log),
        Effect.andThen(
          `KORG nanoPAD not found in the list of connected devices`,
        ),
      ),
    ),
  ),
  Stream.provideLayer(
    EMIDIAccess.layerSystemExclusiveAndSoftwareSynthSupported,
  ),
  Stream.catchTag('MIDIAccessNotSupportedError', e =>
    Stream.succeed(e.cause.message),
  ),
)

// import { Console, Effect, identity, Option, Random, Schedule, Stream } from "effect"
// import { pipe } from "effect/Function"

// const newRandomState = Random.choice(["disconnected", "connected"] as const)
// const randomDeviceId = Random.nextIntBetween(0, 5) as Effect.Effect<0 | 1 | 2 | 3 | 4>

// type DeviceState = Effect.Effect.Success<typeof newRandomState>
// type DeviceId = Effect.Effect.Success<typeof randomDeviceId>

// const mockDeviceConnectionEventStream = pipe(
//   Effect.all({ deviceId: randomDeviceId, newState: newRandomState }),
//   Stream.fromEffect,
//   Stream.repeat(Schedule.spaced("1 seconds")),
//   // Stream.repeat(Schedule.intersect(
//   //   Schedule.spaced("1 seconds"),
//   //   Schedule.recurUpTo("20 seconds")
//   // )),

//   // to ensure that at the beginning there will be no devices that closed out of nowhere
//   // to ensure there will be no duplicate states reported
//   Stream.mapAccum(
//     {
//       "0": "disconnected",
//       "1": "disconnected",
//       "2": "disconnected",
//       "3": "disconnected",
//       "4": "disconnected"
//     } satisfies Record<DeviceId, DeviceState>,
//     (prevAccum, _) => [
//       { ...prevAccum, [_.deviceId]: _.newState },
//       prevAccum[_.deviceId] === _.newState
//         ? Option.none()
//         : Option.some(_)
//     ]
//   ),
//   Stream.filterMap(identity),
//   Stream.tap((e) => Console.log("Device connection event:", e))
// )

// mockDeviceConnectionEventStream.pipe(
//   Stream.runDrain,
//   Effect.runPromise
// )

const dumpRequester = Atom.fn(() =>
  EMIDIAccess.send(
    EMIDIAccess.request({ sysex: true }),
    nanoPadOutputId,
    globalDataDumpRequest,
  ),
)

const textAtom = Atom.make(
  // _MIDIDeviceConnectionEventsStringLog,
  MIDIMessageEventsStringLog,
).pipe(Atom.keepAlive)

export default function Home() {
  const text = useAtomValue(textAtom)
  console.log(text)
  const [, mutate] = useAtom(dumpRequester)

  return (
    <Wrapper>
      <form
        onSubmit={event => {
          event.preventDefault()
          console.log('hex', new FormData(event.target as any).get('hex'))
          mutate()
          // setText(
          //   prev =>
          //     `${new Date().toISOString()} T: ${new FormData(event.target as any).get('hex')}\n${prev}`,
          // )
        }}
      >
        <input type="text" name="hex" />
        <input type="submit" value="send" />
      </form>

      {Result.match(text, {
        onFailure: _ => (
          <>
            failure:
            <br />
            {Cause.pretty(_.cause)}
          </>
        ),
        onInitial: e => <>initial waiting: {e.waiting.toString()}</>,
        onSuccess: s => <pre>{s.value}</pre>,
      })}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  color: wheat;
`
