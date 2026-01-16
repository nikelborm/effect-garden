/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as EArray from 'effect/Array'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Iterable from 'effect/Iterable'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as Pipeable from 'effect/Pipeable'
import * as Record from 'effect/Record'
import * as Ref from 'effect/Ref'
import * as SortedMap from 'effect/SortedMap'
import type * as Types from 'effect/Types'
import * as Unify from 'effect/Unify'

import * as EMIDIInput from './EMIDIInput.ts'
import * as EMIDIOutput from './EMIDIOutput.ts'
import type * as EMIDIPort from './EMIDIPort.ts'
import * as GetPort from './getPortByPortId/getPortByPortIdInContext.ts'
import * as MIDIErrors from './MIDIErrors.ts'
import * as Check from './mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPort.ts'
import * as GetProperty from './mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPort.ts'
import * as StreamMaker from './StreamMaker.ts'
import * as Util from './Util.ts'

// TODO: add stream of messages sent from this device to target midi device

// TODO: fat service APIs, where all the methods are attached to instance and
// where you don't have to constantly write the prefix

// TODO: implement scoping of midi access that will clean up all message queues
// and streams, and remove listeners

// TODO: implement scope inheritance

// TODO: make a Ref with a port map that would be automatically updated by
// listening to the stream of connection events?

// TODO: add a stream to listen for all messages of all currently
// connected inputs, all present inputs, specific input

// TODO: add sinks that will accept command streams to redirect midi commands
// from something into an actual API

// TODO: add effect to wait until connected by port ID

// TODO: reflect sysex and software flags in type-system

// TODO: make matchers that support returning effects from the callback instead of plain values

// TODO: utilities to create mock implementations of objects because, all make methods are internal

// TODO: document that in tests, you need to manually provide the mock access with the tag

// TODO: export react and atom related stuff

// TODO: add streams with reactive live port/input/output maps snapshots

/**
 * Unique symbol used for distinguishing
 * {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance}s from other objects at
 * both runtime and type-level
 * @internal
 */
const TypeId: unique symbol = Symbol.for('effect-web-midi/EMIDIAccessInstance')

/**
 * Unique symbol used for distinguishing
 * {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance}s from other objects at
 * both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * A tag that allows to provide
 * {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance} once with e.g.
 * {@linkcode layer}, {@linkcode layerSystemExclusiveSupported}, etc. and reuse
 * it anywhere, instead of repeatedly {@linkcode request}ing it.
 *
 * The downside of using DI might be that in different places of the app it
 * would be harder to maintain tight MIDI permission scopes.
 *
 * @example
 * ```ts
 * import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess';
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   //  ^ Effect.Effect<
 *   //      void,
 *   //      | AbortError
 *   //      | UnderlyingSystemError
 *   //      | MIDIAccessNotAllowedError
 *   //      | MIDIAccessNotSupportedError
 *   //      never
 *   //    >
 *
 *   const access = yield* EMIDIAccess.EMIDIAccess
 *   //    ^ EMIDIAccess.Instance
 *
 *   console.log(access.sysexEnabled)
 *   //                 ^ true
 * }).pipe(Effect.provide(EMIDIAccess.layerSystemExclusiveSupported))
 * ```
 *
 * @see `navigator.requestMIDIAccess` {@link https://www.w3.org/TR/webmidi/#dom-navigator-requestmidiaccess|Web MIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess|MDN reference}
 */
export class EMIDIAccess extends Context.Tag('effect-web-midi/EMIDIAccess')<
  EMIDIAccess,
  EMIDIAccessInstance
>() {}

export interface RequestMIDIAccessOptions {
  /**
   * This field informs the system whether the ability to send and receive
   * `System Exclusive` messages is requested or allowed on a given
   * {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance} object.
   *
   * If this field is set to `true`, but `System Exclusive` support is denied
   * (either by policy or by user action), the access request will fail with a
   * {@linkcode MIDIErrors.MIDIAccessNotAllowedError} error.
   *
   * If this support is not requested (and allowed), the system will throw
   * exceptions if the user tries to send `System Exclusive` messages, and will
   * silently mask out any `System Exclusive` messages received on the port.
   *
   * @default false
   * @see {@link https://www.w3.org/TR/webmidi/#dom-midioptions-sysex|Web MIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess#sysex|MDN reference}
   */
  readonly sysex?: boolean

  /**
   * This field informs the system whether the ability to utilize any software
   * synthesizers installed in the host system is requested or allowed on a
   * given {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance} object.
   *
   * If this field is set to `true`, but software synthesizer support is denied
   * (either by policy or by user action), the access request will fail with a
   * {@linkcode MIDIErrors.MIDIAccessNotAllowedError} error.
   *
   * If this support is not requested,
   * {@linkcode AllPortsRecord|EMIDIAccess.AllPortsRecord},
   * {@linkcode getInputsRecord|EMIDIAccess.getInputsRecord},
   * {@linkcode OutputsArray|EMIDIAccess.OutputsArray}, etc. would not include
   * any software synthesizers.
   *
   * Note that may result in a two-step request procedure if software
   * synthesizer support is desired but not required - software synthesizers may
   * be disabled when MIDI hardware device access is allowed.
   *
   * @default false
   * @see {@link https://www.w3.org/TR/webmidi/#dom-midioptions-software|Web MIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess#software|MDN reference}
   */
  readonly software?: boolean
}

/**
 * Prototype of all objects satisfying the
 * {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance} type.
 * @internal
 */
const Proto = {
  _tag: 'EMIDIAccess' as const,
  [TypeId]: TypeId,
  [Hash.symbol]() {
    return Hash.structure(this._config)
  },
  [Equal.symbol](that: Equal.Equal) {
    return this === that
  },
  pipe() {
    // biome-ignore lint/complexity/noArguments: Effect's tradition
    return Pipeable.pipeArguments(this, arguments)
  },
  toString() {
    return Inspectable.format(this.toJSON())
  },
  toJSON() {
    return { _id: 'EMIDIAccess', config: this._config }
  },
  [Inspectable.NodeInspectSymbol]() {
    return this.toJSON()
  },

  get sysexEnabled() {
    return assumeImpl(this)._access.sysexEnabled
  },

  get softwareSynthEnabled() {
    return !!assumeImpl(this)._config.software
  },
} as EMIDIAccessImplementationInstance

/**
 * Thin wrapper around raw {@linkcode MIDIAccess} instance. Will be seen in all the
 * external code. Has a word `Instance` in the name to avoid confusion with
 * {@linkcode EMIDIAccess|EMIDIAccess.EMIDIAccess} context tag.
 */
export interface EMIDIAccessInstance
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly _tag: 'EMIDIAccess'

  /**
   * The **`sysexEnabled`** read-only property of the MIDIAccess interface indicates whether system exclusive support is enabled on the current MIDIAccess instance.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIAccess/sysexEnabled)
   */
  readonly sysexEnabled: boolean

  readonly softwareSynthEnabled: boolean
}

/**
 * Thin wrapper around raw {@linkcode MIDIAccess} instance giving access to the
 * actual field storing it. Has a word `Instance` in the name to avoid confusion
 * with {@linkcode EMIDIAccess|EMIDIAccess.EMIDIAccess} context tag.
 * @internal
 */
interface EMIDIAccessImplementationInstance extends EMIDIAccessInstance {
  readonly _access: MIDIAccess
  readonly _config: Readonly<RequestMIDIAccessOptions>
}

/**
 * @param rawAccess The raw {@linkcode MIDIAccess} object from the browser's Web
 * MIDI API to be wrapped.
 * @param config Optional configuration options used to acquire the `rawAccess`,
 * to preserve alongside it.
 *
 * @returns An object with private fields like
 * {@linkcode EMIDIAccessImplementationInstance._access|_access} and
 * {@linkcode EMIDIAccessImplementationInstance._config|_config} that are not
 * supposed to be used externally by user-facing code.
 *
 * @internal
 * @example
 * ```ts
 * const config = { sysex: true };
 * const rawAccess = await navigator.requestMIDIAccess(config);
 * const internalInstance = makeImpl(rawAccess, config);
 * ```
 */
const makeImpl = (
  rawAccess: MIDIAccess,
  config?: Readonly<RequestMIDIAccessOptions>,
): EMIDIAccessImplementationInstance => {
  const instance = Object.create(Proto)
  instance._access = rawAccess
  // TODO: set individual software and sysex flags instead
  instance._config = config ?? {}
  return instance
}

/**
 * Asserts that an `unknown` value is a valid
 * {@linkcode EMIDIAccessImplementationInstance} and casts it to the type.
 * Throws an error if the assertion fails.
 *
 * @internal
 * @example
 * ```ts
 * const unknownValue: null | EMIDIAccessInstance = null
 * try {
 *   const validatedAccess = assertImpl(unknownValue);
 *   // validatedAccess is now known to be EMIDIAccessImplementationInstance
 * } catch (error) {
 *   console.error("Assertion failed:", error);
 * }
 * ```
 */
const assertImpl = (access: unknown) => {
  if (!isImpl(access)) throw new Error('Failed to cast to EMIDIAccess')
  return access
}

/**
 * Asserts that an `unknown` value is a valid {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance}
 * and casts it to the type. Throws an error if the assertion fails.
 *
 * @internal
 * @example
 * ```ts
 * import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess';
 *
 * const unknownValue: null | EMIDIAccess.Instance = null
 *
 * try {
 *   const validatedAccess = EMIDIAccess.assert(unknownValue);
 *   // validatedAccess is now known to be EMIDIAccess.Instance
 * } catch (error) {
 *   console.error("Assertion failed:", error);
 * }
 * ```
 *
 * @see {@linkcode is|EMIDIAccess.is}
 */
export const assert: (access: unknown) => EMIDIAccessInstance = assertImpl

/**
 * Purely a type-level typecast to expose internal fields. Does no runtime
 * validation and assumes you provided
 * {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance} acquired legitimately
 * from `effect-web-midi`.
 *
 * @internal
 * @example
 * ```ts
 * // Assume `accessInstance` is known to be an internal implementation
 * declare const accessPublic: EMIDIAccessInstance;
 * const accessInternal = assumeImpl(accessPublic);
 * console.log('No type error here: ', accessInternal._config)
 * ```
 */
export const assumeImpl = (access: EMIDIAccessInstance) =>
  access as EMIDIAccessImplementationInstance

/**
 * Creates a public-facing {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance}
 * from a raw {@linkcode MIDIAccess} object and optional configuration options
 * used to acquire it. Prevents revealing internal fields set by
 * `effect-web-midi` to the end user.
 *
 * @internal
 * @example
 * ```ts
 * // This is an internal helper, typically not called directly by users.
 * // It's used by the 'request' function to create the instance.
 * const config = { sysex: true }
 * const rawAccess = await navigator.requestMIDIAccess(config);
 * const instance = make(rawAccess, config);
 * ```
 */
const make: (
  rawAccess: MIDIAccess,
  config?: Readonly<RequestMIDIAccessOptions>,
) => EMIDIAccessInstance = makeImpl

/**
 * @internal
 * @example
 * ```ts
 * const accessOrNot: null | EMIDIAccessInstance = null
 *
 * if (isImpl(accessOrNot)) {
 *   const accessInternal = accessOrNot;
 *   // will not be logged
 *   console.log('No type error here: ', accessInternal._config)
 * } else {
 *   console.log('This will be logged because null is not EMIDIAccessInstance')
 * }
 * ```
 */
const isImpl = (access: unknown): access is EMIDIAccessImplementationInstance =>
  typeof access === 'object' &&
  access !== null &&
  Object.getPrototypeOf(access) === Proto &&
  TypeId in access &&
  '_access' in access &&
  typeof access._access === 'object' &&
  '_config' in access &&
  typeof access._config === 'object' &&
  access._config !== null &&
  access._access instanceof MIDIAccess

/**
 * @example
 * ```ts
 * import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess';
 *
 * const accessOrNot: null | EMIDIAccess.Instance = null
 *
 * if (EMIDIAccess.is(accessOrNot)) {
 *   const accessPublic = accessOrNot;
 *   // ts-expect-error You're exposed only to public facing fields
 *   console.log(accessPublic._config)
 *   // will not be logged
 * } else {
 *   console.log('This will be logged because null is not EMIDIAccessInstance')
 * }
 * ```
 *
 * @see {@linkcode assert|EMIDIAccess.assert}
 */
export const is: (access: unknown) => access is EMIDIAccessInstance = isImpl

/**
 * This utility function is used internally to handle different ways MIDI access
 * might be provided, ensuring a consistent type for further operations. It uses
 * the public {@linkcode is|EMIDIAccess.is} type guard for validation. If an
 * effect is passed, errors and requirements are passed-through without
 * modifications.
 *
 * @internal
 * @param polymorphicAccess Either just {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance}, or an
 * Effect having it in the success channel.
 * @returns An effect with type-asserted at runtime
 * {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance}.
 *
 * @example
 * ```ts
 * import * as Effect from 'effect/Effect';
 * import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess';
 *
 * const getValidatedAccess = Effect.gen(function* () {
 *   // Assume `polymorphicAccess` is obtained elsewhere
 *   const polymorphicAccess = {} as EMIDIAccess.PolymorphicInstance;
 *   const validatedAccess = yield* EMIDIAccess.simplify(polymorphicAccess);
 *   // The operation above will throw a defect, because {} is not an access instance
 *   return validatedAccess;
 * });
 * ```
 *
 * @see {@linkcode Util.fromPolymorphic}
 * @see {@linkcode PolymorphicAccessInstance|EMIDIAccess.PolymorphicInstance}
 * @see {@linkcode PolymorphicAccessInstanceClean|EMIDIAccess.PolymorphicCleanInstance}
 */
export const simplify = <E = never, R = never>(
  polymorphicAccess: PolymorphicAccessInstance<E, R>,
) => Util.fromPolymorphic(polymorphicAccess, is)

/**
 * Represents a MIDI access instance that can be provided polymorphically:
 * directly as a value ({@linkcode EMIDIAccessInstance|EMIDIAccess.Instance}),
 * or wrapped in effect. Typically processed by
 * {@linkcode simplify|EMIDIAccess.simplify}.
 *
 * @template E The type of errors that can be thrown while acquiring the access.
 * @template R The environment required to simplify the access.
 *
 * @example
 * ```ts
 * import * as Effect from 'effect/Effect';
 * import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess';
 * import type * as MIDIErrors from 'effect-web-midi/MIDIErrors';
 *
 * let polymorphicAccess: EMIDIAccess.PolymorphicInstance<
 *   | MIDIErrors.MIDIAccessNotAllowedError
 *   | MIDIErrors.MIDIAccessNotSupportedError,
 *   never
 * > = EMIDIAccess.request().pipe(
 *   Effect.catchTag('AbortError', 'UnderlyingSystemError', () =>
 *     Effect.dieMessage('YOLO'),
 *   ),
 * )
 *
 * if (Effect.isEffect(polymorphicAccess)) {
 *   const access: EMIDIAccess.Instance = await Effect.runPromise(polymorphicAccess)
 *   // Assignment of plain instance works just fine
 *   polymorphicAccess = access
 * }
 * ```
 *
 * @see {@linkcode simplify|EMIDIAccess.simplify}
 * @see {@linkcode PolymorphicAccessInstanceClean|EMIDIAccess.PolymorphicCleanInstance}
 */
export type PolymorphicAccessInstance<E, R> = Util.PolymorphicEffect<
  EMIDIAccessInstance,
  E,
  R
>

/**
 * Represents a MIDI access instance that can be provided polymorphically:
 * directly as a value ({@linkcode EMIDIAccessInstance|EMIDIAccess.Instance}),
 * or wrapped in effect that never fails and doesn't require any context.
 * Typically processed by {@linkcode simplify|EMIDIAccess.simplify}.
 *
 * @example
 * ```ts
 * import * as Effect from 'effect/Effect';
 * import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess';
 *
 * let polymorphicAccess: EMIDIAccess.PolymorphicCleanInstance =
 *   Effect.orDie(EMIDIAccess.request())
 *
 * if (Effect.isEffect(polymorphicAccess)) {
 *   const access: EMIDIAccess.Instance =
 *     await Effect.runPromise(polymorphicAccess)
 *   // Assignment of plain instance works just fine
 *   polymorphicAccess = access
 * }
 * ```
 *
 * @see {@linkcode simplify|EMIDIAccess.simplify}
 * @see {@linkcode PolymorphicAccessInstance|EMIDIAccess.PolymorphicInstance}
 */
export type PolymorphicAccessInstanceClean = PolymorphicAccessInstance<
  never,
  never
>

/**
 * This utility type is used internally to infer the type of values stored in
 * {@linkcode MIDIAccess} maps like in {@linkcode MIDIAccess.inputs|.inputs}
 * ({@linkcode MIDIInputMap}) or {@linkcode MIDIAccess.outputs|.outputs}
 * ({@linkcode MIDIOutputMap}) fields.
 *
 * @template T - The `ReadonlyMap` to take value from.
 *
 * @example
 * ```ts
 * declare const myMap: ReadonlyMap<string, number>;
 * type MyMapValue = ValueOfReadonlyMap<typeof myMap>;
 * //   ^ type MyMapValue = number
 * type MyMapValue2 = ValueOfReadonlyMap<MIDIOutputMap>;
 * //   ^ type MyMapValue2 = MIDIOutput
 * ```
 */
type ValueOfReadonlyMap<T> = T extends ReadonlyMap<unknown, infer V> ? V : never

/**
 * Higher-order helper function to canonicalize a subset of raw ports from raw access object
 * into their `effect-web-midi` counterparts using the provided `make` function.
 *
 * @internal
 * @param key The property key of {@linkcode MIDIAccess} like {@linkcode MIDIAccess.inputs|inputs} or {@linkcode MIDIAccess.outputs|outputs} to access the map (e.g. {@linkcode MIDIInputMap} or {@linkcode MIDIOutputMap})
 * @param make A function to wrap the raw MIDI port (e.g. {@linkcode MIDIInput}) from that map into a managed by `effect-web-midi` port instance (e.g. {@linkcode EMIDIInput}).
 * @returns A function that, when given a raw {@linkcode MIDIAccess}, returns an iterable of `[ID, effectful port]` pairs.
 * @example
 * ```ts
 * import * as EMIDIInput from 'effect-web-midi/EMIDIInput';
 *
 * declare const rawAccess: MIDIAccess;
 * const getInputs = getPortEntriesFromRawAccess('inputs', EMIDIInput.make);
 * const inputEntries: Iterable<InputRecordEntry> = getInputs(rawAccess);
 * ```
 */
const getPortEntriesFromRawAccess =
  <
    const TMIDIPortType extends MIDIPortType,
    const TMIDIAccessObjectKey extends `${TMIDIPortType}s`,
    TRawMIDIPort extends ValueOfReadonlyMap<MIDIAccess[TMIDIAccessObjectKey]>,
  >(
    key: TMIDIAccessObjectKey,
    make: (port: TRawMIDIPort) => EMIDIPort.EMIDIPort<TMIDIPortType>,
  ) =>
  (rawAccess: MIDIAccess) =>
    Iterable.map(
      rawAccess[key] as ReadonlyMap<EMIDIPort.Id<TMIDIPortType>, TRawMIDIPort>,
      ([id, raw]) =>
        [id as EMIDIPort.Id<TMIDIPortType>, make(raw)] satisfies Types.TupleOf<
          2,
          unknown
        >,
    )

/**
 * @internal
 * @example
 * ```ts
 * declare const rawAccess: MIDIAccess;
 *
 * for (const [inputId, inputPort] of getInputEntriesFromRaw(rawAccess)) {
 *   //        ^         ^? EMIDIInput.EMIDIInput
 *   //        ^? EMIDIInput.Id
 * }
 * ```
 */
const getInputEntriesFromRaw: {
  (rawAccess: MIDIAccess): Iterable<InputRecordEntry>
} = getPortEntriesFromRawAccess('inputs', EMIDIInput.make)

/**
 * @internal
 * @example
 * ```ts
 * declare const rawAccess: MIDIAccess;
 *
 * for (const [outputId, outputPort] of getOutputEntriesFromRaw(rawAccess)) {
 *   //        ^         ^? EMIDIOutput.EMIDIOutput
 *   //        ^? EMIDIOutput.Id
 * }
 * ```
 */
const getOutputEntriesFromRaw: {
  (rawAccess: MIDIAccess): Iterable<OutputRecordEntry>
} = getPortEntriesFromRawAccess('outputs', EMIDIOutput.make)

/**
 * A single iterable with both inputs and outputs port entries from a raw {@linkcode MIDIAccess} instance.
 *
 * @internal
 * @example
 * ```ts
 * declare const rawAccess: MIDIAccess;
 *
 * for (const entry of getOutputEntriesFromRaw(rawAccess)) {
 *   if (entry[1].type === 'input') {
 *     const [inputId, inputPort] = entry
 *   //       ^         ^? EMIDIInput.EMIDIInput
 *   //       ^? EMIDIInput.Id
 *   } else {
 *     const [outputId, outputPort] = entry
 *   //       ^         ^? EMIDIOutput.EMIDIOutput
 *   //       ^? EMIDIOutput.Id
 *   }
 * }
 * ```
 */
const getAllPortsEntriesFromRaw: {
  (rawAccess: MIDIAccess): Iterable<InputRecordEntry | OutputRecordEntry>
} = raw =>
  Iterable.appendAll(getInputEntriesFromRaw(raw), getOutputEntriesFromRaw(raw))

/**
 *
 * @param getRecordEntriesFromRawAccess Function taking raw {@linkcode MIDIAccess} and returning `[EMIDIPort.Id, EMIDIPort.EMIDIPort]` tuples
 * @returns Function taking {@linkcode PolymorphicAccessInstance|EMIDIAccess.PolymorphicInstance} and returning `Record<Id, EMIDIPort>`
 * @internal
 * @example
 * ```ts
 * import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess';
 * import * as EMIDIInput from 'effect-web-midi/EMIDIInput';
 * import * as Effect from 'effect/Effect';
 *
 * const decorated = decorateToTakePolymorphicAccessAndReturnRecord(
 *   getInputEntriesFromRaw
 * );
 * const inputsEffect = decorated(EMIDIAccess.request());
 * const inputs = await Effect.runPromise(inputsEffect);
 * //    ^? EMIDIInput.IdToInstanceMap
 * ```
 */
const decorateToTakePolymorphicAccessAndReturnRecord = <
  T extends UnknownEntriesUnion,
>(
  getRecordEntriesFromRawAccess: (rawAccess: MIDIAccess) => Iterable<T>,
) =>
  (polymorphicAccess =>
    Effect.map(
      simplify(polymorphicAccess),
      EFunction.flow(
        assumeImpl,
        impl => impl._access,
        getRecordEntriesFromRawAccess,
        Record.fromEntries,
      ),
    )) as GetPortRecordFromPolymorphicAccess<T>

/**
 * Interface for functions that retrieve a port record from polymorphic access.
 */
export interface GetPortRecordFromPolymorphicAccess<
  RecordEntries extends UnknownEntriesUnion,
> {
  /**
   * @param polymorphicAccess Optionally wrapped in effect {@linkcode EMIDIAccessInstance|EMIDIAccess.Instance}.
   * @returns Effect with `Record` of MIDI port ids mapped to according effectful ports
   */
  <E = never, R = never>(
    polymorphicAccess: PolymorphicAccessInstance<E, R>,
  ): Effect.Effect<EntriesToRecord<RecordEntries>, E, R>
}

/**
 * Utility type to convert union of entries to a record type.
 *
 * @template Entries The union of entry tuples.
 */
export type EntriesToRecord<Entries extends UnknownEntriesUnion> =
  Types.UnionToIntersection<
    Entries extends unknown ? Record<Entries[0], Entries[1]> : never
  >

/**
 * Placeholder tuple representing `Record` entry
 */
export type UnknownEntriesUnion = [string, unknown]

/**
 * Because `MIDIInputMap` can potentially be a mutable object, meaning new
 * devices can be added or removed at runtime, it is effectful.
 *
 * The **`inputs`** read-only property of the MIDIAccess interface provides
 * access to any available MIDI input ports.
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIAccess/inputs)
 */
export const getInputsRecord: GetPortRecordFromPolymorphicAccess<InputRecordEntry> =
  decorateToTakePolymorphicAccessAndReturnRecord(getInputEntriesFromRaw)

type InputRecordEntry = [EMIDIInput.Id, EMIDIInput.EMIDIInput]

/**
 * Because `MIDIOutputMap` can potentially be a mutable object, meaning new
 * devices can be added or removed at runtime, it is effectful.
 *
 * The **`outputs`** read-only property of the MIDIAccess interface provides
 * access to any available MIDI output ports.
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIAccess/outputs)
 */
export const getOutputsRecord: GetPortRecordFromPolymorphicAccess<OutputRecordEntry> =
  decorateToTakePolymorphicAccessAndReturnRecord(getOutputEntriesFromRaw)

type OutputRecordEntry = [EMIDIOutput.Id, EMIDIOutput.EMIDIOutput]

/**
 *
 *
 */
export const getAllPortsRecord: GetPortRecordFromPolymorphicAccess<AllPortEntryUnion> =
  decorateToTakePolymorphicAccessAndReturnRecord(getAllPortsEntriesFromRaw)

type AllPortEntryUnion = InputRecordEntry | OutputRecordEntry

export interface InputsRecordInContextEffect
  extends Effect.Effect<EMIDIInput.InputIdToInstanceMap, never, EMIDIAccess> {}

/**
 *
 *
 */
export const InputsRecord: InputsRecordInContextEffect =
  getInputsRecord(EMIDIAccess)

export interface OutputsRecordInContextEffect
  extends Effect.Effect<
    EMIDIOutput.OutputIdToInstanceMap,
    never,
    EMIDIAccess
  > {}

/**
 *
 *
 */
export const OutputsRecord: OutputsRecordInContextEffect =
  getOutputsRecord(EMIDIAccess)

export interface AllPortsRecordInContextEffect
  extends Effect.Effect<
    EMIDIPort.BothIdToBothInstanceMap,
    never,
    EMIDIAccess
  > {}

/**
 *
 *
 */
export const AllPortsRecord: AllPortsRecordInContextEffect =
  getAllPortsRecord(EMIDIAccess)

export interface GetPortArrayFromPolymorphicAccess<Port> {
  /**
   *
   */
  <E = never, R = never>(
    polymorphicAccess: PolymorphicAccessInstance<E, R>,
  ): Effect.Effect<Port[], E, R>
}

/**
 * Because `MIDIInputMap` can potentially be a mutable object, meaning new
 * devices can be added or removed at runtime, it is effectful.
 *
 * The **`inputs`** read-only property of the MIDIAccess interface provides
 * access to any available MIDI input ports.
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIAccess/inputs)
 */
export const getInputsArray: GetPortArrayFromPolymorphicAccess<EMIDIInput.EMIDIInput> =
  EFunction.flow(getInputsRecord, Effect.map(Record.values))

/**
 * Because `MIDIOutputMap` can potentially be a mutable object, meaning new
 * devices can be added or removed at runtime, it is effectful.
 *
 * The **`outputs`** read-only property of the MIDIAccess interface provides
 * access to any available MIDI output ports.
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIAccess/outputs)
 */
export const getOutputsArray: GetPortArrayFromPolymorphicAccess<EMIDIOutput.EMIDIOutput> =
  EFunction.flow(getOutputsRecord, Effect.map(Record.values))

/**
 *
 *
 */
export const getAllPortsArray: GetPortArrayFromPolymorphicAccess<
  EMIDIOutput.EMIDIOutput | EMIDIInput.EMIDIInput
> = EFunction.flow(getAllPortsRecord, Effect.map(Record.values))

export interface InputsArrayInContextEffect
  extends Effect.Effect<EMIDIInput.EMIDIInput[], never, EMIDIAccess> {}

/**
 *
 *
 */
export const InputsArray: InputsArrayInContextEffect =
  getInputsArray(EMIDIAccess)

export interface OutputsArrayInContextEffect
  extends Effect.Effect<EMIDIOutput.EMIDIOutput[], never, EMIDIAccess> {}

/**
 *
 *
 */
export const OutputsArray: OutputsArrayInContextEffect =
  getOutputsArray(EMIDIAccess)

export interface AllPortsArrayInContextEffect
  extends Effect.Effect<
    (EMIDIOutput.EMIDIOutput | EMIDIInput.EMIDIInput)[],
    never,
    EMIDIAccess
  > {}

/**
 *
 *
 */
export const AllPortsArray: AllPortsArrayInContextEffect =
  getAllPortsArray(EMIDIAccess)

/**
 * [MIDIConnectionEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeAllPortsStateChangesStream =
  StreamMaker.createStreamMakerFrom<MIDIPortEventMap>()(
    is,
    access => ({
      tag: 'MIDIPortStateChange',
      eventListener: {
        target: assumeImpl(access)._access,
        type: 'statechange',
      },
      spanAttributes: {
        spanTargetName: 'MIDI access handle',
        requestedAccessConfig: assumeImpl(access)._config,
      },
      nullableFieldName: 'port',
    }),
    rawPort =>
      ({
        newState: rawPort
          ? ({
              ofDevice: rawPort.state,
              ofConnection: rawPort.connection,
            } as const)
          : null,
        port:
          rawPort instanceof globalThis.MIDIInput
            ? EMIDIInput.make(rawPort)
            : rawPort instanceof globalThis.MIDIOutput
              ? EMIDIOutput.make(rawPort)
              : null,
      }) as const,
  )

/**
 * beware that it's not possible to ensure the messages will either be all
 * delivered, or all not delivered, as in ACID transactions. There's not even a
 * mechanism to remove a specific message (not all) from the sending queue
 */
export const send: DualSendMIDIMessageFromAccess = EFunction.dual<
  SendMIDIMessageAccessLast,
  SendMIDIMessageAccessFirst
>(
  Util.polymorphicCheckInDual(is),
  Effect.fn('EMIDIAccess.send')(
    function* (polymorphicAccess, target, midiMessage, timestamp) {
      const access = yield* simplify(polymorphicAccess)

      const outputs = yield* getOutputsRecord(access)

      if (target === 'all existing outputs at effect execution')
        return yield* EFunction.pipe(
          Record.values(outputs),
          Effect.forEach(EMIDIOutput.send(midiMessage, timestamp)),
          Effect.as(access),
        )

      if (target === 'all open connections at effect execution')
        return yield* EFunction.pipe(
          Record.values(outputs),
          // TODO: maybe also do something about pending?
          Effect.filter(Check.isOutputConnectionOpenByPort),
          Effect.flatMap(
            Effect.forEach(EMIDIOutput.send(midiMessage, timestamp)),
          ),
          Effect.as(access),
        )

      // TODO: maybe since deviceState returns always connected devices we can
      // simplify this check by applying intersections and comparing lengths

      const portsIdsToSend: EMIDIOutput.Id[] = EArray.ensure(target)

      const deviceStatusesEffect = portsIdsToSend.map(id =>
        EFunction.pipe(
          Record.get(outputs, id),
          Option.match({
            onNone: () => Effect.succeed('disconnected' as const),
            onSome: EFunction.flow(GetProperty.getOutputDeviceStateByPort),
          }),
          effect => Unify.unify(effect),
          Effect.map(state => ({ id, state })),
        ),
      )

      const disconnectedDevice = EArray.findFirst(
        yield* Effect.all(deviceStatusesEffect),
        _ => _.state === 'disconnected',
      )

      if (Option.isSome(disconnectedDevice))
        return yield* new MIDIErrors.CannotSendToDisconnectedPortError({
          portId: disconnectedDevice.value.id,
          cause: new DOMException(
            // TODO: make an experiment and paste the error text here
            'TODO: imitate there an error thats thrown when the port is disconnected',
            'InvalidStateError',
          ) as DOMException & { name: 'InvalidStateError' },
        })

      const sendToSome = (predicate: (id: EMIDIOutput.Id) => boolean) =>
        Effect.all(
          Record.reduce(
            outputs,
            [] as EMIDIOutput.SentMessageEffectFromPort<never, never>[],
            // TODO: investigate what the fuck is going on, why the fuck can't I
            // make it a simple expression without either nesting it in
            // curly-braced function body or adding manual type-annotation
            (acc, port, id) =>
              predicate(id)
                ? [
                    ...acc,
                    EMIDIOutput.send(
                      port,
                      midiMessage,
                      timestamp,
                    ) as EMIDIOutput.SentMessageEffectFromPort,
                  ]
                : acc,
          ),
        )

      yield* sendToSome(id => portsIdsToSend.includes(id))

      return access
    },
  ),
)

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeMessagesStreamByInputId = <
  const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
>(
  id: EMIDIInput.Id,
  options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
) =>
  EMIDIInput.makeMessagesStreamByPort(
    GetPort.getInputByPortIdInContext(id),
    options,
  )

// TODO: makeMessagesStreamByInputIdAndAccess
export const makeMessagesStreamByInputIdAndAccess = () => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}

/**
 *
 */
export const sendToPortById = (
  id: EMIDIOutput.Id,
  ...args: EMIDIOutput.SendFromPortArgs
) =>
  Effect.asVoid(
    EMIDIOutput.send(GetPort.getOutputByPortIdInContext(id), ...args),
  )

/**
 *
 */
export const clearPortById = EFunction.flow(
  GetPort.getOutputByPortIdInContext,
  EMIDIOutput.clear,
  Effect.asVoid,
)

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeAllPortsStateChangesStreamInContext = <
  const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
>(
  options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
) => makeAllPortsStateChangesStream(EMIDIAccess, options)

/**
 *
 *
 */
export const sendInContext = (...args: SendFromAccessArgs) =>
  Effect.asVoid(send(EMIDIAccess, ...args))

/**
 * @param options
 *
 * @returns An Effect representing a request for access to MIDI devices on a
 * user's system. Available only in secure contexts.
 */
export const request = Effect.fn('EMIDIAccess.request')(function* (
  options?: RequestMIDIAccessOptions,
) {
  yield* Effect.annotateCurrentSpan({ options })

  const rawAccess = yield* Effect.tryPromise({
    try: () => navigator.requestMIDIAccess(options),
    catch: MIDIErrors.remapErrorByName(
      {
        AbortError: MIDIErrors.AbortError,

        InvalidStateError: MIDIErrors.UnderlyingSystemError,

        NotAllowedError: MIDIErrors.MIDIAccessNotAllowedError,
        // SecurityError is kept for compatibility reason
        // (https://github.com/WebAudio/web-midi-api/pull/267):
        SecurityError: MIDIErrors.MIDIAccessNotAllowedError,

        NotSupportedError: MIDIErrors.MIDIAccessNotSupportedError,
        // For case when navigator doesn't exist
        ReferenceError: MIDIErrors.MIDIAccessNotSupportedError,
        // For case when navigator.requestMIDIAccess is undefined
        TypeError: MIDIErrors.MIDIAccessNotSupportedError,
      },
      'EMIDIAccess.request error handling absurd',
      { whileAskingForPermissions: options ?? {} },
    ),
  })

  // TODO: finish this

  const _ref = yield* Ref.make(
    SortedMap.empty<EMIDIPort.BothId, MIDIPortType>(Order.string),
  )

  // return make(rawAccess, options, ref)
  return make(rawAccess, options)
})

// TODO: clear all outputs

/**
 *
 * **Errors:**
 *
 * - {@linkcode MIDIErrors.AbortError} Description
 * - {@linkcode MIDIErrors.UnderlyingSystemError} Description
 * - {@linkcode MIDIErrors.MIDIAccessNotSupportedError} Description
 * - {@linkcode MIDIErrors.MIDIAccessNotAllowedError} Description
 *
 * @param config
 * @returns
 */
export const layer = (config?: RequestMIDIAccessOptions) =>
  Layer.effect(EMIDIAccess, request(config))

/**
 *
 */
export const layerMostRestricted = layer()

/**
 *
 */
export const layerSystemExclusiveSupported = layer({ sysex: true })

/**
 *
 */
export const layerSoftwareSynthSupported = layer({ software: true })

/**
 *
 */
export const layerSystemExclusiveAndSoftwareSynthSupported = layer({
  software: true,
  sysex: true,
})

export interface SentMessageEffectFromAccess<E = never, R = never>
  extends Util.SentMessageEffectFrom<EMIDIAccessInstance, E, R> {}

export type TargetPortSelector =
  | 'all existing outputs at effect execution'
  | 'all open connections at effect execution'
  | EMIDIOutput.Id
  | EMIDIOutput.Id[]

export interface DualSendMIDIMessageFromAccess
  extends SendMIDIMessageAccessFirst,
    SendMIDIMessageAccessLast {}

export type SendFromAccessArgs = [
  targetPortSelector: TargetPortSelector,
  ...args: EMIDIOutput.SendFromPortArgs,
]

export interface SendMIDIMessageAccessFirst {
  /**
   *
   *
   */
  <E = never, R = never>(
    polymorphicAccess: PolymorphicAccessInstance<E, R>,
    ...args: SendFromAccessArgs
  ): SentMessageEffectFromAccess<E, R>
}

export interface SendMIDIMessageAccessLast {
  /**
   *
   *
   */
  (
    ...args: SendFromAccessArgs
  ): {
    /**
     *
     *
     */
    <E = never, R = never>(
      polymorphicAccess: PolymorphicAccessInstance<E, R>,
    ): SentMessageEffectFromAccess<E, R>
  }
}

export interface GetThingByPortId<
  TSuccess,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessFirst<
      TSuccess,
      TTypeOfPortId,
      TAccessGettingFallbackError,
      TAccessGettingFallbackRequirement,
      TAdditionalError,
      TAdditionalRequirement
    >,
    GetThingByPortIdAccessLast<
      TSuccess,
      TTypeOfPortId,
      TAccessGettingFallbackError,
      TAccessGettingFallbackRequirement,
      TAdditionalError,
      TAdditionalRequirement
    > {}

export interface GetThingByPortIdAccessFirst<
  TSuccess,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  <TAccessGettingError = never, TAccessGettingRequirement = never>(
    polymorphicAccess: PolymorphicAccessInstance<
      TAccessGettingError,
      TAccessGettingRequirement
    >,
    id: EMIDIPort.Id<TTypeOfPortId>,
  ): AcquiredThing<
    TSuccess,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface GetThingByPortIdAccessLast<
  TSuccess,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  (
    id: EMIDIPort.Id<TTypeOfPortId>,
  ): GetThingByPortIdAccessLastSecondHalf<
    TSuccess,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface GetThingByPortIdAccessLastSecondHalf<
  TSuccess,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  <TAccessGettingError = never, TAccessGettingRequirement = never>(
    polymorphicAccess: PolymorphicAccessInstance<
      TAccessGettingError,
      TAccessGettingRequirement
    >,
  ): AcquiredThing<
    TSuccess,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface AcquiredThing<
  TSuccess,
  TAccessGettingError,
  TAccessGettingRequirement,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends Effect.Effect<
    TSuccess,
    | Util.FallbackOnUnknownOrAny<
        TAccessGettingError,
        TAccessGettingFallbackError
      >
    | TAdditionalError,
    | Util.FallbackOnUnknownOrAny<
        TAccessGettingRequirement,
        TAccessGettingFallbackRequirement
      >
    | TAdditionalRequirement
  > {}
