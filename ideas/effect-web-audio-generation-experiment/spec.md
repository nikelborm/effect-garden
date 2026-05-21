# Spec

## Main mission

I want to build a code-generation tool, that would take WebRef IDL
structured declaration from `@types/webidl2`, and `@webref/idl` NPM packages, as
well as the unstructured text of the specs, and generate Effect.ts
wrappers around them.

I already wrote some wrappers to get a feeling of what I want the generated code
to look like.

A tiny subset of specs I wrapped by hand:
1. https://www.w3.org/TR/webaudio
2. https://fs.spec.whatwg.org/
3. https://www.w3.org/TR/mediacapture-streams/
4. https://www.w3.org/TR/webmidi

The most comprehensive of which is webmidi.

I want to have comprehensive end-to-end testing with playwright, so that every
single wrapper object and wrapper functions would be attempted to be constructed
in a real browser environment, and all sorts of things would be done to it. I
need to ensure that every single error, that could ever be thrown would be
captured in type-system in error channel, and I want to make them as discrete as
possible. As well as I need a way to ensure that if an error is declared in type
declaration, we would actually have a test, ensuring it's thrown, in some, or
all browsers.

Since I don't have access to most major LLM providers, I need to ensure
generation is supported using local providers like Ollama.

The main benefit of effect here is exposing all of the documented and
undocumented errors, the API can throw. I need to have a way to do elaborate
fuzzing of the browser environment configuration to find undocumented errors. I
don't yet know how would I do the fuzzing, but IT MUST BE DONE. Since everything
would be run in resource restricted light-weight containers, it should not be
super difficult, we just need to pray that playwright exposes a way of advanced
configuration of the browsers it's launching.

I would need concurrent workers, handling many generation threads in parallel.

I would need reliable persistence, in particular postgresql, which would store,
all of the info accumulated during the generation and testing.

The generation and validation should run not as a big step, but in parallel for
individual generated files.

Each generation step should be parallelizable, except the generation steps
focused on specific files.

The most important part is the way I want to use LLMs with generation. I
specifically don't want to make LLMs generate any code. Instead all of the code
would be algorithmically generated based on the choices or JSON outputs made by
the LLM. So I would have a series of prompts, which would ask LLM for judgement,
and then resulting `boolean`, `string[]`, anything else would influence branches
of the code generation.

At the moment I can think of only a few potential judgments an LLM can make:

1. it can decide if the object, I'm generating a wrapper for, worth having in
   context, or not. Another interpretation of this is how many instances of the
   object, can we have, and how long-living these objects would be. For example:
   AudioContext is a long-living object, and most-likely will have only one
   instance per application. This means, we can build Effect's Layers allowing
   the reuse the object. This would influence a switch in generating layers.
   Since layers can have normal names, the better idea instead of boolean, we
   would ask an LLM for `{ params: /*objects params that would be passed, to
   create a preconfigured layer, like const layerSystemExclusiveSupported =
   layer({ sysex: true }) */, layerName: string /* like
   "layerWithSystemExclusiveSupported" */ }[]`. MIDIAccess is the same story.
   It's intended to be alone and be shared across different parts of the app.
   However for AudioBuffer, there's no real sense in creating a layer
2. it can determine if the object is serializable or not, and if there would be
   a point in serialization of it. Depending if it is or not, we would add
   `toJSON` method or `toString` methods.
3. it can determine what fields of an object would be rendered by calling
   special node.js's inspect symbol method, and based on the fields, the method
   would be generated.
4. it can help generate the inline JSDoc comments, meaning the natural human
   text. The only problem here is enriching the JSDoc with actual real @linkcode
   references, for which we would need to maintain a dependency graph
5. it can extract from the spec file a list of errors, that we would later try
   to reproduce, and generate more type-safe versions of these errors.
6. it can structurally show the template literal that would be rendered for
   error messages like this:

   ```ts
   export class MalformedMIDIMessageError extends
     Schema.TaggedError<MalformedMIDIMessageError>()(
     'MalformedMIDIMessageError',
     {
       cause: ErrorSchema(Schema.Literal('TypeError')),
       portId: PortId,
       midiMessage: Schema.Array(Schema.Int),
     },
   ) {
     override get message() {
       return `Attempted to send invalid MIDI message (${
         this.midiMessage.length
       } bytes)`
     }
   }
   ```

7. The LLM can generate the test body, while it would not have access to
   test-code surrounding it. it would be given just a few points of control,
   like server config, maybe some specific headers, to reproduce security policy
   and would just have a single return statement. We need to find potential ways
   it would try to cheat, and automatically regenerate tests, caught at cheating.
8. the LLM can build constructors and schemas for very rich with metadata
   errors, and provide a way to generate the constructor generator. Meaning the
   function that would take some ts-compiler AST tokens with variables and
   return ts-compiler AST expression that would be injected in the final
   function body.
9. LLM can determine if the object can be addressed by some stable ID, from some
   larger map, or context object. An example would be addressing MIDI ports from
   midi input port map, and MIDI port output map by their respective IDs. So
   that the user can call methods operating on ports, by providing port id and
   MIDIAccess instance, or even just port id and expect MIDIAccess to be
   provided in Effect requirements channel. Example:
   `matchOutputDeviceStateByPortIdAndAccess`

So in principle, I need LLM to generate as less arbitrary text as possible,
instead I need it to generate serializable objects enriched with metadata,
configs, or just plain stupid answers like yes/no. I consider the strongest part
of LLM to be intelligence, and I need that intelligence to be strongly
formalized, each output validated against the schema, and preserved into
database as logs.

The important part is recovery of the long-running server. I will setup the
reboot policy, that would send keep-alive signals, so that if a server crashes
because of too many containers, or something else, or just hangs, I would be
able to reboot it, and my generator will continue where it left off.

Since I would fuzz the absolute hell out of the browser, some errors will
inescapably cause crashes. Some of them would even cause consistent crashes.
That's fine. if a tests crashes a few times in a row, it would be marked as
problematic in the database and would be left for me to review later.

The generator is intended to be long-running, since local LLMs are slow, or any
LLMs to be fair. The system should be ready for evolution over time, and should
support invalidation of choices made by LLMs. I need to have invalidation as
easy, as running an SQL UPDATE command, or better yet, have some interactive
CLI. Each generation step would have an ID, be it validation, typescript
type-checking step, an LLM call, or something else. Each step MUST be a pure
function in the sense, that it only requires something passed directly to it as
an input, and would have a stable output based on the input. The generation
steps would be versioned by hash. Meaning, I would have a folder with some
files. I would have a lock-file with dependencies. I would bundle the each
transformation step to a separate standalone executable IIFE script. Each script
would server only one function. it would declare its dependencies, and export
default function with the implementation. it would not modify anything from the
outside world. This way we get automatically versioning and tracking if certain
parts of the generated codebase should be rebuilt.

We need a system of review of artifacts, to inject manual human review and
feedback directly into the generation loop. I want to be able to review any
artifact, and build prompts directly mid-runtime from these good or bad
examples.

I MUST ensure, everything possible, stays logged in the database. This is needed
for a few things. Analytics and evolution, building educational dataset, and
collecting common patters of failures, so that I can improve and iterate the
prompt over time. And crash recovery. I can't stand losing data and resources. I
don't care if it would make the generation slower, it would never be slower,
than the calling API. Especially if the API costs money.

I would also need a reliable way of isolation between workers. I would spawn
docker containers per each test run of generated test code to ensure safety and
that the model won't break

Right now I'm planning the architecture of the project. This is a massive
project, because it should be very generic relative to the things, the generated
Effect functions and objects would be wrapping.

I need a way to make course-correction and AB testing in real time. I need a way
for the system to self-improve the prompts. Meaning each generation run, it
would either create a test that's actually generates the correct code inside
JSDoc or the correct test-body that reproduces the expected error/result, or it
would generate the garbage test. If a certain combination of a model, and config
produces failing test, we should analyze the reason for test failure like was it
because the previous code failed, or because the test is garbage, or the
environment config is not fuzzy enough, and with these metrics in mind, generate
prompt alternatives, and then measure them.

I also need a way to inject human-validation into the loop, but in a
non-blocking manner. I need the system, to automatically mutate some parameters
used for generation and mark them as experiments, and also mark as "from code"
for parameters that were set in the actual code.

Important thing to think about is the distribution of the generator, or the
generated code. The good idea will be to distribute not a single hardcoded
version of the world, hoping it would fit the needs of the user, but instead
distribute a baseline json config, and allow customizations.

The generator should support 2 modes of generation. One where all of the inputs
cached, and everything is completely statically generated without any inference.
The config file could either be KDL, YAML, JSON, SQL file (that could later be
applied to pglite, or pg instance), pglite database snapshot. The static mode of
generation is intended to be distributed inside the company, so that the
generation is run only once, and the inference is done only once, and everybody
reuses the result of the generation. We can also support specifying a URL with a
hash and maybe human-readable tag, to fetch specific configs from other sources
like github, or company's file server like gitlab. If the script would find
missing choices, we could suggest 3 options to control the behavior: generate
all permutations, generate safe default (the one chosen by LLM in safe upstream
like GitHub Releases), ask individually for every choice, inference inline. The
customizations need to be not only for particular parameters, but also for any
config used to generate the artifact upstream. Like the user should be able to
customize the model, the model parameters, the provider URL, the prompt (in two
modes: git patch, or complete override)

I need an easy UX, like bundling a server into a simple npx command, as well as
making that command a CLI also.

I need everything to be stored in database. Like the code of each individual
test, the code that were run to produce the artifact, the parameters that were
present to produce the artifact, etc. Almost like my own DAGster but with
Effect.ts

During the generation, I need to be able to see the progress of every process
ang generation step, that's happening.

WebIDL defines interfaces. for each high-level interface, we create a file with
one prototype object wrapping the original interface, and export a lot of
tree-shakeable methods, that call underlying Promise-returning APIs. An example
of webref IDL interface:

```js
{
  type: 'interface',
  partial: false,
  name: 'MIDIAccess',
  inheritance: 'EventTarget',
  members: [
    {
      idlType: {
        subtype: [],
        type: 'attribute-type',
        generic: '',
        nullable: false,
        union: false,
        idlType: 'MIDIInputMap'
      },
      type: 'attribute',
      special: '',
      readonly: true,
      name: 'inputs'
    },
    {
      idlType: {
        subtype: [],
        type: 'attribute-type',
        generic: '',
        nullable: false,
        union: false,
        idlType: 'MIDIOutputMap'
      },
      type: 'attribute',
      special: '',
      readonly: true,
      name: 'outputs'
    },
    {
      idlType: {
        subtype: [],
        type: 'attribute-type',
        generic: '',
        nullable: false,
        union: false,
        idlType: 'EventHandler'
      },
      type: 'attribute',
      special: '',
      readonly: false,
      name: 'onstatechange'
    },
    {
      idlType: {
        subtype: [],
        type: 'attribute-type',
        generic: '',
        nullable: false,
        union: false,
        idlType: 'boolean'
      },
      type: 'attribute',
      special: '',
      readonly: true,
      name: 'sysexEnabled'
    }
  ]
}
```

I already started manually writing objects, and you can look at what I've
written manually here as an example:

```ts
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
```

Now I need your help with exploring potential parameters that an LLM can control
or output as structured data, that later will be turned into code. I also would
need a review of the design mentioned above and what have I missed and didn't
think through well.
