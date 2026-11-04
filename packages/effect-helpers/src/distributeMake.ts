/**
 * The callable part of a lambda, with the phantom slots stripped off. `Lambda`
 * itself is only a promise about the slots, so this is what a callback has to
 * actually look like before it can be ascribed to a lambda.
 */
export type AsPlainCall<Lambda> = Lambda extends (
  ...args: infer Args
) => infer Return
  ? (...args: Args) => Return
  : never

/**
 * Expands every slot of a tuple into its own union member, so a tuple of unions
 * becomes the union of tuples that agree on one value per slot:
 * `[A | B, C | D]` gives `[A, C] | [A, D] | [B, C] | [B, D]`. A union of input
 * tuples is expanded too, which is what makes it usable with
 * {@link DistributedApply}: each produced tuple is a single argument list the
 * lambda can be applied to without collapsing the correlation between slots.
 *
 * The accumulator is carried explicitly because TypeScript only eliminates tail
 * calls of the form `Head extends ... ? Recurse<Tail, [...Acc, Head]> : ...`.
 */
export type DistributeAllArgs<
  TArgs extends readonly unknown[],
  TAcc extends unknown[] = [],
> = TArgs extends readonly [infer Head, ...infer Tail]
  ? Head extends unknown
    ? DistributeAllArgs<Tail, [...TAcc, Head]>
    : never
  : TAcc

/**
 * A conditional type is the only place where TypeScript distributes over the
 * members of a union, so `ApplyAllArgs` has to be wrapped into one to get
 * `ApplyAllArgs<Lambda, A> | ApplyAllArgs<Lambda, B>` instead of
 * `ApplyAllArgs<Lambda, A | B>`, which keeps the union inside every slot.
 */
export type DistributedApply<
  Lambda extends LambdaAllArgs,
  TInput,
> = TInput extends unknown ? ApplyAllArgs<Lambda, TInput> : never

/**
 * Applies a type lambda to values whose types are unions, so the union lands in
 * the slots of the lambda's output instead of being repeated in each of them:
 * `A | B` gives `Apply<A> | Apply<B>`, never `Apply<A | B>`. When several
 * arguments are unions, {@link DistributeAllArgs} pairs one member of each
 * before the lambda is applied, so the output stays correlated across every
 * argument rather than only the first one.
 *
 * The lambda is the callback itself — not a separate type argument hanging next
 * to a plain function. A plain `(input: TInput) => TOutput` callback would have
 * to be checked against the whole union at once, which is exactly the situation
 * that erases the correlation between the slots; a lambda-shaped callback keeps
 * its own call signature, so its parameter stays generic and its return type
 * keeps saying which slot holds which element for each member of the union.
 *
 * The input type is taken from the lambda (`'~lambda.inAllArgsTuple'`) rather
 * than inferred from the argument, so a lambda whose input is a union can't be
 * applied to a narrower value by accident.
 */
export const distribute = <
  TLambda extends LambdaAllArgs,
  TIn extends NoInfer<TLambda>['~lambda.inAllArgsTuple'],
>(
  make: TLambda,
  ...args: TIn
) =>
  // the lambda's call signature is checked against its own declaration, which
  // is the only place the pairing of the slots is written down
  (make as unknown as AsPlainCall<TLambda>)(...args) as DistributedApply<
    TLambda,
    DistributeAllArgs<TIn>
  >

export const distributeExplicit =
  <TLambda extends LambdaAllArgs>() =>
  <TIn extends NoInfer<TLambda>['~lambda.inAllArgsTuple']>(
    make: AsPlainCall<TLambda>,
    ...args: TIn
  ) =>
    distribute(make as unknown as TLambda, ...args)

/**
 * Wraps a plain function as a {@link LambdaAllArgs} value
 *
 * **When to use**
 *
 * Use to create a typed lambda for mapping APIs that need type-level input and
 * output tracking.
 *
 * **Details**
 *
 * The type parameter `L` encodes both the input and output types at the type
 * level, allowing the compiler to track how types change. At runtime, the
 * returned value is the same function; `lambdaAllArgs` only adjusts the type.
 *
 * **Example** (Computing the output type of a lambda)
 *
 * ```ts
 * import type { ApplyAllArgs, LambdaAllArgs } from '@evadev/effect-helpers/distributeMake.ts'
 *
 * interface ConcatLiteralsWithSpace extends LambdaAllArgs {
 *   readonly "~lambda.inAllArgsTuple": [string, string]
 *   readonly "~lambda.out": `${this['~lambda.inAllArgsTuple'][0]} ${this['~lambda.inAllArgsTuple'][1]}`
 * }
 *
 * // type Result = "Hello, World!"
 * type Result = ApplyAllArgs<ConcatLiteralsWithSpace, ['Hello,', 'World!']>
 *
 * // Type '"Hello,[something_else]World!"' is not assignable to type '"Hello, World!"'.
 * const witness: Result = "Hello,[something_else]World!"
 * ```
 *
 * @see {@link Lambda} – the type-level interface
 * @see {@link map} – apply a lambda to all struct values
 * @stability stable
 * @category constructors
 * @since 4.0.0
 */
export const lambdaAllArgs = <
  L extends {
    (...args: any[]): any
    readonly '~lambda.inAllArgsTuple': unknown[]
    readonly '~lambda.out': unknown
  },
>(
  f: AsPlainCall<L>,
) => f as unknown as L

/**
 * Interface for type-level functions
 *
 * **Details**
 *
 * Extend this interface with concrete `~lambda.inAllArgsTuple` and
 * `~lambda.out` types to describe how a function transforms values at the type
 * level. At runtime, create lambda values with {@link lambdaAllArgs}.
 *
 * **Example** (Computing the output type of a lambda)
 *
 * ```ts
 * import type { ApplyAllArgs, LambdaAllArgs } from '@evadev/effect-helpers/distributeMake.ts'
 *
 * interface ConcatLiteralsWithSpace extends LambdaAllArgs {
 *   readonly "~lambda.inAllArgsTuple": [string, string]
 *   readonly "~lambda.out": `${this['~lambda.inAllArgsTuple'][0]} ${this['~lambda.inAllArgsTuple'][1]}`
 * }
 *
 * // type Result = "Hello, World!"
 * type Result = ApplyAllArgs<ConcatLiteralsWithSpace, ['Hello,', 'World!']>
 *
 * // Type '"Hello,[something_else]World!"' is not assignable to type '"Hello, World!"'.
 * const witness: Result = "Hello,[something_else]World!"
 * ```
 *
 * @see {@link ApplyAllArgs} – apply a LambdaAllArgs to a concrete type
 * @see {@link lambdaAllArgs} – create a runtime lambda value
 * @stability stable
 * @category utility types
 * @since 4.0.0
 */
export interface LambdaAllArgs {
  readonly '~lambda.inAllArgsTuple': unknown[]
  readonly '~lambda.out': unknown
}

/**
 * Applies a {@link LambdaAllArgs} type-level function to a value type `V`,
 * producing the output type.
 *
 * **When to use**
 *
 * Use when you need to compute what type a LambdaAllArgs would produce for a
 * given input.
 *
 * **Details**
 *
 * This works by intersecting the Lambda with `{ "~lambda.inAllArgsTuple": V }`
 * and reading `"~lambda.out"`.
 *
 * **Example** (Computing the output type of a lambda)
 *
 * ```ts
 * import type { ApplyAllArgs, LambdaAllArgs } from '@evadev/effect-helpers/distributeMake.ts'
 *
 * interface ConcatLiteralsWithSpace extends LambdaAllArgs {
 *   readonly "~lambda.inAllArgsTuple": [string, string]
 *   readonly "~lambda.out": `${this['~lambda.inAllArgsTuple'][0]} ${this['~lambda.inAllArgsTuple'][1]}`
 * }
 *
 * // type Result = "Hello, World!"
 * type Result = ApplyAllArgs<ConcatLiteralsWithSpace, ['Hello,', 'World!']>
 *
 * // Type '"Hello,[something_else]World!"' is not assignable to type '"Hello, World!"'.
 * const witness: Result = "Hello,[something_else]World!"
 * ```
 *
 * @see {@link LambdaAllArgs} – the base interface
 * @stability stable
 * @category utility types
 * @since 4.0.0
 */
export type ApplyAllArgs<L extends LambdaAllArgs, V> = (L & {
  readonly '~lambda.inAllArgsTuple': V
})['~lambda.out']
