import * as EArray from 'effect/Array'
import * as Brand from 'effect/Brand'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import { pipe } from 'effect/Function'
import * as Hash from 'effect/Hash'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'

// Built with the help of spec from here
// ! https://www.w3.org/TR/webmidi/

const ErrorSchema = Schema.Struct({
  name: Schema.NonEmptyTrimmedString,
  message: Schema.NonEmptyTrimmedString,
  stack: Schema.NonEmptyTrimmedString.pipe(
    Schema.optionalWith({ exact: true }),
  ),
  cause: Schema.Unknown.pipe(Schema.optionalWith({ exact: true })),
})

/**
 * Thrown if the document or page is closed due to user navigation.
 */
export class AbortError extends Schema.TaggedError<AbortError>()('AbortError', {
  cause: ErrorSchema,
}) {}

/**
 * Thrown if the underlying system raises any errors.
 */
export class InvalidStateError extends Schema.TaggedError<InvalidStateError>()(
  'InvalidStateError',
  { cause: ErrorSchema },
) {}

/**
 * Thrown if the feature or options are not supported by the system.
 */
export class NotSupportedError extends Schema.TaggedError<NotSupportedError>()(
  'NotSupportedError',
  { cause: ErrorSchema },
) {}

/**
 * The object does not support the operation or argument. Thrown if the port is
 * unavailable.
 */
export class InvalidAccessError extends Schema.TaggedError<InvalidAccessError>()(
  'InvalidAccessError',
  { cause: ErrorSchema },
) {}

/**
 * Thrown if the user or system denies the application from creating a
 * MIDIAccess object with the requested options, or if the document is not
 * allowed to use the feature (for example, because of a Permission Policy, or
 * because the user previously denied a permission request).
 *
 * SecurityError in MIDI spec was replaced by NotAllowedError.
 */
export class NotAllowedError extends Schema.TaggedError<NotAllowedError>()(
  'NotAllowedError',
  { cause: ErrorSchema },
) {}

export class BadMidiMessageError extends Schema.TaggedError<BadMidiMessageError>()(
  'BadMidiMessageError',
  { cause: ErrorSchema },
) {}

/**
 * Unique identifier of the MIDI port.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/id)
 */
export type MIDIPortId = string & Brand.Brand<'MIDIPortId'>

export const MIDIPortId = Brand.nominal<MIDIPortId>()

export type StreamMakerOptions<TOnNullStrategy extends OnNullStrategy> =
  | boolean
  | Readonly<{
      capture?: boolean
      passive?: boolean
      once?: boolean
      bufferSize?: number | 'unbounded' | undefined
      onExtremelyRareNullableField?: TOnNullStrategy
    }>
  | undefined

const validOnNullStrategies = new Set([
  'fail',
  'die',
  'ignore',
  'passthrough',
] as const)

export type OnNullStrategy =
  | (typeof validOnNullStrategies extends Set<infer U> ? U : never)
  | undefined

/**
 * It's important to keep StreamValue as a separate generic because typescript
 * is a bit dumb, and for some reason starts to complain about usage of `this`
 * keyword, when passed to `cameFrom` param
 */
export type StreamValue<
  TTag extends string,
  TCameFrom,
  Additional extends object,
> = {
  readonly _tag: TTag
  readonly cameFrom: TCameFrom
  readonly capturedAt: Date
} & Additional

const createStreamMakerFrom =
  <TEventTypeToEventValueMap extends object>() =>
  <
    TEventTarget extends Stream.EventListener<
      TEventTypeToEventValueMap[TSelectedEventType]
    >,
    const TNullableFieldName extends Extract<
      keyof TEventTypeToEventValueMap[TSelectedEventType],
      string
    >,
    TSelectedEventType extends Extract<keyof TEventTypeToEventValueMap, string>,
    TCameFrom,
    const TTag extends string,
    TContainerWithNullableFields extends object,
  >({
    tag,
    eventListener: { target, type },
    spanAttributes,
    nullableFieldName: field,
    cameFrom,
    remapValueToContainer,
  }: {
    tag: TTag
    eventListener: { target: TEventTarget; type: TSelectedEventType }
    spanAttributes: { spanTargetName: string; [k: string]: unknown }
    nullableFieldName: TNullableFieldName
    cameFrom: TCameFrom
    remapValueToContainer: (
      fieldValue: TEventTypeToEventValueMap[TSelectedEventType][TNullableFieldName],
    ) => TContainerWithNullableFields
  }) =>
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TOnNullStrategy>,
  ) => {
    const onNullStrategy = ((options as any)?.onExtremelyRareNullableField ??
      'die') as Exclude<OnNullStrategy, undefined>

    if (!validOnNullStrategies.has(onNullStrategy))
      throw new Error(
        `Invalid strategy to handle nullish values: ${onNullStrategy}`,
      )

    const missingFieldMessage = `Property ${field} of ${tag} is null`
    const NullCausedErrorEffect = new Cause.NoSuchElementException(
      missingFieldMessage,
    ) as unknown as Effect.Effect<
      never,
      [TOnNullStrategy] extends ['fail'] ? Cause.NoSuchElementException : never
    >
    type DoubleRemapped = ContainerAllOrNothingNullable<
      TContainerWithNullableFields,
      TOnNullStrategy
    >
    type StreamSuccess = StreamValue<TTag, TCameFrom, DoubleRemapped>

    return Stream.fromEventListener(target, type, options).pipe(
      Stream.filter(event => !!event[field] || onNullStrategy !== 'ignore'),
      Stream.mapEffect(event =>
        event[field] || onNullStrategy === 'passthrough'
          ? Effect.succeed({
              _tag: tag,
              ...(remapValueToContainer(event[field]) as DoubleRemapped),
              cameFrom,
              capturedAt: new Date(),
            } satisfies StreamSuccess as StreamSuccess)
          : onNullStrategy === 'fail'
            ? NullCausedErrorEffect
            : Effect.dieMessage(missingFieldMessage),
      ),
      Stream.withSpan('MIDI Web API event stream', {
        kind: 'producer',
        attributes: { eventType: type, ...spanAttributes },
      }),
    )
  }

const midiPortStaticFields = [
  'id',
  'name',
  'manufacturer',
  'version',
  'type',
] as const

export type MIDIPortStaticFields = (typeof midiPortStaticFields)[number]

const remapErrorByName =
  <
    TErrorNameToTaggedErrorClassMap extends {
      [name: string]: new (arg: {
        cause: Schema.Schema.Encoded<typeof ErrorSchema>
      }) => Error
    },
  >(
    map: TErrorNameToTaggedErrorClassMap,
    absurdMessage: string,
  ) =>
  (cause: unknown) => {
    if (!(cause instanceof Error && cause.name in map))
      throw new Error(absurdMessage)
    type TErrorClassUnion =
      TErrorNameToTaggedErrorClassMap[keyof TErrorNameToTaggedErrorClassMap]
    const Class = map[cause.name] as TErrorClassUnion
    return new Class({ cause }) as InstanceType<TErrorClassUnion>
  }

export const requestRawMIDIAccess = (options?: MIDIOptions) =>
  Effect.tryPromise({
    try: () => navigator.requestMIDIAccess(options),
    catch: remapErrorByName(
      {
        AbortError,
        InvalidStateError,
        NotSupportedError,
        NotAllowedError,
        // because of https://github.com/WebAudio/web-midi-api/pull/267
        SecurityError: NotAllowedError,
        // For case when navigator doesn't exist
        ReferenceError: NotSupportedError,
        // For case when navigator.requestMIDIAccess is undefined
        TypeError: NotSupportedError,
      },
      'requestRawMIDIAccess error handling absurd',
    ),
  }).pipe(
    Effect.withSpan('Request raw MIDI access', { attributes: { options } }),
  )

const getStaticMIDIPortInfo = (port: MIDIPort) =>
  Struct.pick(port, ...midiPortStaticFields)

class RawAccessContainer {
  protected readonly rawAccess: MIDIAccess
  protected readonly config: MIDIOptions | undefined
  constructor(rawAccess: MIDIAccess, config?: MIDIOptions) {
    this.rawAccess = rawAccess
    this.config = config
  }
}

type ValueOfReadonlyMap<T> = T extends ReadonlyMap<unknown, infer V> ? V : never

/**
 * A type that represents a deeply readonly object. This is similar to
 * TypeScript's `Readonly` type, but it recursively applies the `readonly`
 * modifier to all properties of an object and all elements of arrays.
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends object
    ? {
        readonly [K in keyof T]: DeepReadonly<T[K]>
      }
    : T

export type ContainerAllOrNothingNullable<
  TContainerWithNullableFields extends object,
  TOnNullStrategy extends OnNullStrategy,
> = Readonly<
  | {
      [k in keyof TContainerWithNullableFields]: Exclude<
        TContainerWithNullableFields[k],
        null
      >
    }
  | ([TOnNullStrategy] extends ['passthrough']
      ? { [k in keyof TContainerWithNullableFields]: null }
      : never)
>

export class EffectfulMIDIAccess
  extends RawAccessContainer
  implements Pick<MIDIAccess, 'sysexEnabled'>
{
  readonly _tag = 'EffectfulMIDIAccess'

  readonly #mapMutablePortMap = <
    const TMIDIAccessObjectKey extends 'inputs' | 'outputs',
    TRawMIDIPort extends ValueOfReadonlyMap<MIDIAccess[TMIDIAccessObjectKey]>,
    TEffectfulMIDIPort extends EffectfulMIDIPort<TRawMIDIPort>,
  >(
    key: TMIDIAccessObjectKey,
    Class: new (port: TRawMIDIPort) => TEffectfulMIDIPort,
  ) =>
    Effect.sync(() =>
      pipe(
        this.rawAccess[key] as ReadonlyMap<MIDIPortId, TRawMIDIPort>,
        SortedMap.fromIterable(Order.string),
        SortedMap.map(port => new Class(port)),
      ),
    )

  /**
   * Because MIDIInputMap can potentially be a mutable object, meaning new
   * devices can be added or removed at runtime, it is effectful.
   *
   * The **`inputs`** read-only property of the MIDIAccess interface provides
   * access to any available MIDI input ports.
   *
   * [MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIAccess/inputs)
   */
  readonly inputs = this.#mapMutablePortMap('inputs', EffectfulMIDIInputPort)

  /**
   * Because MIDIOutputMap can potentially be a mutable object, meaning new
   * devices can be added or removed at runtime, it is effectful.
   *
   * The **`outputs`** read-only property of the MIDIAccess interface provides
   * access to any available MIDI output ports.
   *
   * [MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIAccess/outputs)
   */
  readonly outputs = this.#mapMutablePortMap('outputs', EffectfulMIDIOutputPort)

  /**
   * [MIDIConnectionEvent MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
   */
  readonly makeMIDIPortStateChangesStream = createStreamMakerFrom<{
    statechange: MIDIConnectionEvent
  }>()({
    tag: 'MIDIPortStateChange',
    eventListener: { target: this.rawAccess, type: 'statechange' },
    spanAttributes: {
      spanTargetName: 'MIDI access handle',
      requestedAccessConfig: this.config,
    },
    nullableFieldName: 'port',
    cameFrom: this,
    remapValueToContainer: port => ({
      newState: port
        ? ({ ofDevice: port.state, ofConnection: port.connection } as const)
        : null,
      port:
        port instanceof MIDIInput
          ? new EffectfulMIDIInputPort(port)
          : port instanceof MIDIOutput
            ? new EffectfulMIDIOutputPort(port)
            : null,
    }),
  })

  get sysexEnabled() {
    return this.rawAccess.sysexEnabled
  }

  // TODO: add a stream to listen for all messages of all currently
  // connected inputs, all present inputs, specific input

  /**
   * beware that it's not possible to ensure the messages will either be all
   * delivered, or all not delivered, as in ACID transactions. There's not even
   * a mechanism to remove the message from the sending queue
   */
  readonly send = Effect.fn('send')(function* (
    this: EffectfulMIDIAccess,
    target:
      | 'all existing outputs at effect execution'
      | 'all open connections at effect execution'
      | MIDIPortId
      | MIDIPortId[],
    ...args: Parameters<EffectfulMIDIOutputPort['send']>
  ) {
    const outputs = yield* this.outputs
    if (target === 'all existing outputs at effect execution')
      return yield* outputs.pipe(
        SortedMap.values,
        // biome-ignore lint/suspicious/useIterableCallbackReturn: Effect's fine
        Effect.forEach(port => port.send(...args)),
        Effect.asVoid,
      )

    if (target === 'all open connections at effect execution')
      return yield* outputs.pipe(
        SortedMap.values,
        // TODO: maybe also do something about pending?
        Effect.filter(port =>
          Effect.map(port.connectionState, state => state === 'open'),
        ),
        // biome-ignore lint/suspicious/useIterableCallbackReturn: Effect's fine
        Effect.flatMap(Effect.forEach(port => port.send(...args))),
        Effect.asVoid,
      )

    // TODO: maybe since deviceState returns always connected devices we can
    // simplify this check by applying intersections and comparing lenghts

    const portsIdsToSend: MIDIPortId[] = EArray.ensure(target)

    const deviceStatusesEffect = portsIdsToSend.map(id =>
      Option.match(SortedMap.get(outputs, id), {
        onNone: () => Effect.succeed('disconnected' as const),
        onSome: output => output.deviceState,
      }),
    )

    const deviceStatuses = yield* Effect.all(deviceStatusesEffect)

    if (deviceStatuses.includes('disconnected'))
      return yield* new InvalidStateError({
        cause: new DOMException(
          'InvalidStateError',
          // TODO: imitate
          'TODO: imitate there an error thats thrown when the port is diconnected',
        ),
      })

    const sendToSome = (predicate: (id: MIDIPortId) => boolean) =>
      Effect.all(
        SortedMap.reduce(
          outputs,
          [] as ReturnType<EffectfulMIDIOutputPort['send']>[],
          (acc, port, id) =>
            predicate(id) ? (acc.push(port.send(...args)), acc) : acc,
        ),
      )

    yield* sendToSome(id => portsIdsToSend.includes(id))
  }).bind(this)
}

class RawPortContainer<TRawMIDIPort extends MIDIPort> {
  protected readonly rawPort: TRawMIDIPort
  constructor(rawPort: TRawMIDIPort) {
    this.rawPort = rawPort
  }
}

export class EffectfulMIDIPort<TRawMIDIPort extends MIDIPort>
  extends RawPortContainer<TRawMIDIPort>
  implements Pick<MIDIPort, MIDIPortStaticFields>, Equal.Equal
{
  readonly _tag = 'EffectfulMIDIPort'

  constructor(rawPort: TRawMIDIPort) {
    super(rawPort)
    this.type = rawPort.type
  }

  [Hash.symbol]() {
    return Hash.string(this.id)
  }
  [Equal.symbol](that: Equal.Equal) {
    return 'id' in that && this.id === that.id
  }

  /**
   * [MIDIConnectionEvent MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
   */
  readonly makeMIDIPortStateChangesStream = createStreamMakerFrom<{
    statechange: MIDIConnectionEvent
  }>()({
    tag: 'MIDIPortStateChange',
    eventListener: { target: this.rawPort, type: 'statechange' },
    spanAttributes: {
      spanTargetName: 'MIDI port',
      port: getStaticMIDIPortInfo(this.rawPort),
    },
    nullableFieldName: 'port',
    cameFrom: this,
    remapValueToContainer: port => ({
      newState: port
        ? { ofDevice: port.state, ofConnection: port.connection }
        : null,
    }),
  })

  /**
   * Because device state can change over time, it's effectful.
   * The **`state`** read-only property of the MIDIPort interface returns the
   * state of the port.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/state)
   */
  readonly deviceState = Effect.sync(() => this.rawPort.state)

  /**
   * Because connection state can change over time, it's effectful.
   *
   * The **`connection`** read-only property of the MIDIPort interface returns
   * the connection state of the port.
   *
   * [MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/connection)
   */
  readonly connectionState = Effect.sync(() => this.rawPort.connection)
  // TODO: refactor so its supports `clear` and `send` also
  readonly #callMIDIPortMethod = <TError = never>(
    method: 'close' | 'open',
    mapError: (err: unknown) => TError,
  ): Effect.Effect<this, TError> =>
    pipe(
      Effect.tryPromise({ try: () => this.rawPort[method](), catch: mapError }),
      Effect.map(() => this),
      Effect.withSpan(`MIDI port method call`, {
        attributes: { method, port: getStaticMIDIPortInfo(this.rawPort) },
      }),
    )

  // TODO: documentation
  readonly open = this.#callMIDIPortMethod(
    'open',
    remapErrorByName(
      { InvalidAccessError },
      'MIDI port open error handling absurd',
    ),
  )

  // TODO: documentation
  readonly close = this.#callMIDIPortMethod('close', err => {
    throw err
  })

  get id() {
    return this.rawPort.id
  }

  get name() {
    return this.rawPort.name
  }

  get manufacturer() {
    return this.rawPort.manufacturer
  }

  get version() {
    return this.rawPort.version
  }

  readonly type
}

export class EffectfulMIDIInputPort extends EffectfulMIDIPort<MIDIInput> {
  constructor(rawPort: MIDIInput) {
    if (rawPort.type !== 'input')
      throw new Error('EffectfulMIDIInputPort accepts only MIDIInput')

    super(rawPort)
    this.type = rawPort.type
  }

  override readonly type

  /**
   * [MIDIMessageEvent MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIMessageEvent)
   *
   * MIDI spec says that synthetically built messages can have `data` field
   * equal to null, but in all other normal cases it's not. The default behavior
   * is to die on null.
   */
  readonly makeMessagesStream = createStreamMakerFrom<MIDIInputEventMap>()({
    tag: 'MIDIMessage',
    eventListener: { target: this.rawPort, type: 'midimessage' },
    spanAttributes: {
      spanTargetName: 'MIDI port',
      port: getStaticMIDIPortInfo(this.rawPort),
    },
    cameFrom: this,
    nullableFieldName: 'data',
    remapValueToContainer: data => ({ data }),
  })
}

export class EffectfulMIDIOutputPort extends EffectfulMIDIPort<MIDIOutput> {
  constructor(rawPort: MIDIOutput) {
    if (rawPort.type !== 'output')
      throw new Error('EffectfulMIDIOutputPort accepts only MIDIOutput')

    super(rawPort)
    this.type = rawPort.type
  }

  override readonly type

  // TODO: add documentation
  /**
   * If data is a System Exclusive message, and the MIDIAccess did not enable
   * System Exclusive access, an InvalidAccessError exception will be thrown
   *
   * If the port is "connected" but the connection is "closed", asynchronously
   * tries to open the port. It's unclear in the spec if potential error of
   * `open` call would result in an InvalidAccessError error coming from the
   * send method itself.
   */
  readonly send = (data: Iterable<number>, timestamp?: DOMHighResTimeStamp) =>
    Effect.try({
      try: () => this.rawPort.send(data, timestamp),
      catch: remapErrorByName(
        {
          InvalidAccessError,
          InvalidStateError,
          TypeError: BadMidiMessageError,
        },
        'MIDI port open error handling absurd',
      ),
    }).pipe(
      Effect.withSpan('EffectfulMIDIOutputPort.send', {
        attributes: {
          data,
          timestamp,
          port: getStaticMIDIPortInfo(this.rawPort),
        },
      }),
    )

  // TODO: fix upstream type-signature, add documentation
  // @ts-ignore
  readonly clear = Effect.sync(() => this.rawPort.clear()).pipe(
    Effect.withSpan('EffectfulMIDIOutputPort.clear', {
      attributes: { port: getStaticMIDIPortInfo(this.rawPort) },
    }),
  )
}

export const requestEffectfulMIDIAccess = (config?: MIDIOptions) =>
  Effect.map(
    requestRawMIDIAccess(config),
    access => new EffectfulMIDIAccess(access, config),
  )

export const withParsedDataField = <
  A extends { data: Uint8Array<ArrayBuffer> },
  E,
  R,
>(
  self: Stream.Stream<A, E, R>,
) => Stream.map(self, Struct.evolve({ data: dataEntryParser }))

// export const withTouchPadPositionUpdates

export type NoteRelease = Readonly<{
  _tag: 'Note Release'
  channel: number
  note: number
}>

export type NotePress = Readonly<{
  _tag: 'Note Press'
  channel: number
  note: number
  velocity: number
}>

export type UnknownReply = Readonly<{
  _tag: 'Unknown Reply'
  data: string
  stack: string
}>

export type ControlChange = Readonly<{
  _tag: 'Control Change'
  channel: number
  control: number
  value: number
}>

export type TouchpadRelease = Readonly<{
  _tag: 'Touchpad Release'
  channel: number
}>

export type PitchBendChange = Readonly<{
  _tag: 'Pitch Bend Change'
  channel: number
  value: number
}>

export type TouchpadPositionUpdate = Readonly<{
  _tag: 'Touchpad Position Update'
  x: number
  y: number
}>

function dataEntryParser(
  data: Uint8Array<ArrayBuffer>,
):
  | NoteRelease
  | NotePress
  | UnknownReply
  | ControlChange
  | TouchpadRelease
  | PitchBendChange {
  const unknown = () => {
    const { stackTraceLimit } = Error
    Error.stackTraceLimit = 4
    const stackHolder = {} as { stack: string }
    Error.captureStackTrace(stackHolder)
    Error.stackTraceLimit = stackTraceLimit
    const result = {
      _tag: 'Unknown Reply' as const,
      data: data.toString(),
      stack: stackHolder.stack,
    }
    return result
  }
  if (data.length !== 3) return unknown()
  const first = data.at(0)
  if (first === undefined) return unknown()

  const second = data.at(1)
  if (second === undefined) return unknown()

  const third = data.at(2)
  if (third === undefined) return unknown()

  const code = first >> 4
  const channel = first & 0b1111

  if (code === 0x8) {
    if (third !== 0x40) return unknown()
    return {
      _tag: 'Note Release',
      channel,
      note: second,
    }
  }

  if (code === 0x9) {
    if (third === 0) return unknown()
    return {
      _tag: 'Note Press',
      channel,
      note: second,
      velocity: third,
    }
  }

  if (code === 0xb) {
    return {
      _tag: 'Control Change',
      channel,
      control: second,
      value: third,
    }
  }

  if (code === 0xe) {
    if (second === 0 && third === 0x40)
      return { _tag: 'Touchpad Release', channel }

    if (second === third)
      return { _tag: 'Pitch Bend Change', channel, value: second }
    return unknown()
  }
  return unknown()
}

export const withTouchpadPositionUpdate = <
  A extends {
    data:
      | ControlChange
      | TouchpadRelease
      | PitchBendChange
      | { _tag: string & {} }
  },
  E,
  R,
>(
  self: Stream.Stream<A, E, R>,
): Stream.Stream<
  A | (Omit<A, 'data'> & { data: TouchpadPositionUpdate }),
  E,
  R
> =>
  Stream.mapAccum(
    self,
    { x: 0, y: 0, seenPressedTouchpadEventsInARow: 0 },
    (ctx, current) => {
      const { data, ...rest } = current
      const select = <T extends any>(control: T, pitch: T, previous: T) =>
        ({
          'Control Change': control,
          'Pitch Bend Change': pitch,
          'Touchpad Release': 0, // resets everything
        })[data._tag as string] ?? previous

      const position = {
        x: select(ctx.x, (data as PitchBendChange).value, ctx.x),
        y: select((data as ControlChange).value, ctx.y, ctx.y),
      }

      const seenPressedTouchpadEventsInARow = select(
        ctx.seenPressedTouchpadEventsInARow + 1,
        ctx.seenPressedTouchpadEventsInARow + 1,
        ctx.seenPressedTouchpadEventsInARow,
      )

      return [
        { ...position, seenPressedTouchpadEventsInARow },
        seenPressedTouchpadEventsInARow > 1 &&
        (position.x !== ctx.x || position.y !== ctx.y)
          ? Stream.make(current, {
              ...rest,
              data: { _tag: 'Touchpad Position Update' as const, ...position },
            })
          : Stream.succeed(current),
      ]
    },
  ).pipe(Stream.flatten())

export const mapToGlidingStringLogOfLimitedEntriesCount =
  <A>(
    windowSize: number,
    showFirst: 'latest' | 'oldest',
    objectify: (current: NoInfer<A>) => object,
  ) =>
  <E, R>(self: Stream.Stream<A, E, R>) => {
    if (windowSize < 1) throw new Error('Window size should be greater than 0')
    return Stream.mapAccum(
      self,
      { text: '', entrySizeLog: [] as number[] },
      ({ entrySizeLog: oldLog, text: oldText }, current) => {
        const currMapped = pipe(
          objectify(current),
          Record.toEntries,
          EArray.map(EArray.join(': ')),
          EArray.join(', '),
        )

        const potentiallyShiftedLog =
          oldLog.length >= windowSize
            ? oldLog.slice(...(showFirst === 'latest' ? [0, -1] : [1]))
            : oldLog

        const potentiallyShiftedText =
          oldLog.length >= windowSize
            ? oldText.slice(
                ...(showFirst === 'latest'
                  ? [0, -oldLog.at(-1)! - 1]
                  : [oldLog.at(0)! + 1]),
              )
            : oldText

        const text =
          showFirst === 'latest'
            ? currMapped + '\n' + potentiallyShiftedText
            : potentiallyShiftedText + currMapped + '\n'

        const entrySizeLog =
          showFirst === 'latest'
            ? [currMapped.length, ...potentiallyShiftedLog]
            : [...potentiallyShiftedLog, currMapped.length]

        return [{ text, entrySizeLog }, text]
      },
    )
  }
