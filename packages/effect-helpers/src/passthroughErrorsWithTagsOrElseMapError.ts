import { Effect, Predicate as P } from 'effect';
import type { NonEmptyReadonlyArray } from 'effect/Array';
import { dual } from 'effect/Function';

/**
 * Passes the errors through unmodified if their tags match any of the whitelisted tags. When
 * the error doesn't match, maps the error to an Effect, either successful or
 * not.
 *
 * @example
 *
 * ```ts
 * class CustomErr1 extends Data.TaggedError('CustomErr1')<{}> {}
 * class CustomErr2 extends Data.TaggedError('CustomErr2')<{}> {}
 * class CustomErr3 extends Data.TaggedError('CustomErr3')<{}> {}
 * class UnknownException extends Data.TaggedError('UnknownException')<{
 *   cause: unknown;
 * }> {}
 *
 * const program1 = Random.choice(
 *   //  ^ Effect.Effect<"yay", CustomErr1 | UnknownException, never>
 *   [
 *     new CustomErr1(),
 *     new CustomErr2(),
 *     new CustomErr3(),
 *     Effect.fail('non object err failure' as const),
 *     Effect.succeed('yay' as const),
 *   ] as const,
 * ).pipe(
 *   Effect.andThen(e => e),
 *   passthroughErrorsWithTagsOrElseMapError(
 *     cause => new UnknownException({ cause }),
 *     // ^ NoInfer<CustomErr2 | CustomErr3 | "non object err failure">
 *     'CustomErr1',
 *     // ^ This tag have autocomplete inference
 *   ),
 * );
 *
 * const program2 = passthroughErrorsWithTagsOrElseMapError(
 *   //  ^ Effect.Effect<
 *   //      "yay!" | "not yay: non object err failure",
 *   //      CustomErr1,
 *   //      FileSystem.FileSystem
 *   //    >
 *   // Passthrough helper merged types (including requirements) of effect returned
 *   // from orElseMapRestOfErrors and initial `Effect.gen(...)` with filtered
 *   // error channel
 *   Effect.gen(function* () {
 *     if (Math.random() > 0.5)
 *       return yield* Effect.fail('non object err failure' as const);
 *
 *     if (Math.random() > 0.5) return yield* new CustomErr1();
 *
 *     return 'yay!' as const;
 *   }),
 *   cause =>
 *     // ^ "non object err failure"
 *     Effect.flatMap(FileSystem.FileSystem, () =>
 *       Effect.succeed(`not yay: ${cause}` as const),
 *     ),
 *   'CustomErr1',
 * );
 *
 * const program3 = Effect.gen(function* () {
 *   //  ^ Effect.Effect<
 *   //      "yay!",
 *   //      CustomErr1 | CustomErr2 | CustomErr3,
 *   //      never
 *   //    >
 *   if (Math.random() > 0.5) return yield* new CustomErr1();
 *   if (Math.random() > 0.5) return yield* new CustomErr2();
 *   if (Math.random() > 0.5) return yield* new CustomErr3();
 *
 *   return 'yay!' as const;
 * }).pipe(
 *   // passthrough helper won't add anything to the `self` Effect type, because we
 *   // pass through all of the errors
 *   passthroughErrorsWithTagsOrElseMapError(
 *     cause =>
 *       // ^ never
 *       FileSystem.FileSystem.pipe(
 *         Effect.flatMap(() => Effect.succeed(`will never be called` as const)),
 *         Effect.tap(() => Console.log(`will never be called`)),
 *       ),
 *     'CustomErr1',
 *     'CustomErr2',
 *     'CustomErr3',
 *     // These tags have autocomplete inference, and you can specify many of them,
 *     // but you can't handle here non-tagged things from error channel
 *   ),
 * );
 * ```
 */
export const passthroughErrorsWithTagsOrElseMapError = dual<
  // data-last
  <
    AllSelfE,
    PassableSelfE extends GetPassableErrors<AllSelfE>,
    const ErrorTagsToPassThrough extends PassableSelfE['_tag'],
    ElseA,
    ElseE,
    ElseR,
  >(
    orElseMapRestOfErrors: OrElseMapRestOfErrors<
      ErrorTagsToPassThrough,
      AllSelfE,
      ElseA,
      ElseE,
      ElseR
    >,
    ...errorTagsToPassThrough: NonEmptyReadonlyArray<ErrorTagsToPassThrough>
  ) => <SelfA, SelfR>(
    effect: Effect.Effect<SelfA, AllSelfE, SelfR>,
  ) => GetFinalEffect<
    ErrorTagsToPassThrough,
    SelfA,
    AllSelfE,
    SelfR,
    ElseA,
    ElseE,
    ElseR
  >,
  // data-first
  <
    SelfA,
    SelfR,
    AllSelfE,
    PassableSelfE extends GetPassableErrors<AllSelfE>,
    const ErrorTagsToPassThrough extends PassableSelfE['_tag'],
    ElseA,
    ElseE,
    ElseR,
  >(
    self: Effect.Effect<SelfA, AllSelfE, SelfR>,
    orElseMapRestOfErrors: OrElseMapRestOfErrors<
      ErrorTagsToPassThrough,
      AllSelfE,
      ElseA,
      ElseE,
      ElseR
    >,
    ...errorTagsToPassThrough: NonEmptyReadonlyArray<ErrorTagsToPassThrough>
  ) => GetFinalEffect<
    ErrorTagsToPassThrough,
    SelfA,
    AllSelfE,
    SelfR,
    ElseA,
    ElseE,
    ElseR
  >
>(
  (args: any) => Effect.isEffect(args[0]),
  <
    SelfA,
    SelfR,
    AllSelfE,
    PassableSelfE extends GetPassableErrors<AllSelfE>,
    const ErrorTagsToPassThrough extends PassableSelfE['_tag'],
    ElseA,
    ElseE,
    ElseR,
  >(
    self: Effect.Effect<SelfA, AllSelfE, SelfR>,
    orElseMapRestOfErrors: OrElseMapRestOfErrors<
      ErrorTagsToPassThrough,
      AllSelfE,
      ElseA,
      ElseE,
      ElseR
    >,
    ...errorTagsToPassThrough: NonEmptyReadonlyArray<ErrorTagsToPassThrough>
  ): GetFinalEffect<
    ErrorTagsToPassThrough,
    SelfA,
    AllSelfE,
    SelfR,
    ElseA,
    ElseE,
    ElseR
  > => {
    const errorTagsToPassThroughSet = new Set<TagMinimum>(
      errorTagsToPassThrough,
    );
    const isTag = P.or(P.isNumber, P.or(P.isString, P.isSymbol));

    const isPossibleToFilterByTag = P.compose(
      P.hasProperty('_tag'),
      (e): e is PassableSelfE => isTag(e['_tag']),
    );

    const isInPassthroughSet = (err: PassableSelfE) =>
      errorTagsToPassThroughSet.has(err['_tag']);

    const willPassThrough = P.compose(
      isPossibleToFilterByTag,
      isInPassthroughSet,
    );

    const newEffect = Effect.catchIf(
      self,
      P.not(willPassThrough) as P.Refinement<
        unknown,
        GetErrorsThatWillBeRemapped<AllSelfE, ErrorTagsToPassThrough>
      >,
      orElseMapRestOfErrors,
    );

    // Type assertion is needed because I added a bit smarter mechanism, that
    // will not include UnknownException in the output, if we pass through all
    // of the errors we could

    return newEffect as GetFinalEffect<
      ErrorTagsToPassThrough,
      SelfA,
      AllSelfE,
      SelfR,
      ElseA,
      ElseE,
      ElseR
    >;
  },
);

type GetFinalEffect<
  ErrorTagsToPassThrough extends TagMinimum,
  SelfA,
  AllSelfE,
  SelfR,
  ElseA,
  ElseE,
  ElseR,
> = Effect.Effect<
  GetFinal<AllSelfE, ErrorTagsToPassThrough, SelfA, ElseA>,
  GetFinal<
    AllSelfE,
    ErrorTagsToPassThrough,
    GetErrorsToPassThroughFromAllE<AllSelfE, ErrorTagsToPassThrough>,
    ElseE
  >,
  GetFinal<AllSelfE, ErrorTagsToPassThrough, SelfR, ElseR>
>;

type OrElseMapRestOfErrors<
  ErrorTagsToPassThrough extends TagMinimum,
  AllSelfE,
  ElseA,
  ElseE,
  ElseR,
> = (
  cause: NoInfer<GetErrorsThatWillBeRemapped<AllSelfE, ErrorTagsToPassThrough>>,
) => Effect.Effect<ElseA, ElseE, ElseR>;

type GetFinal<
  AllSelfE,
  ErrorTagsToPassThrough extends TagMinimum,
  Base,
  OptionalSuffix,
> =
  GetErrorsToPassThroughFromAllE<
    AllSelfE,
    ErrorTagsToPassThrough
  > extends infer ErrorsToPassThrough
    ? Base | ([AllSelfE] extends [ErrorsToPassThrough] ? never : OptionalSuffix)
    : never;

type GetErrorsToPassThroughFromPassableE<
  PassableSelfE extends TaggedMinimum,
  ErrorTagsToPassThrough extends TagMinimum,
> = Extract<PassableSelfE, { _tag: ErrorTagsToPassThrough }>;

type GetErrorsToPassThroughFromAllE<
  AllSelfE,
  ErrorTagsToPassThrough extends TagMinimum,
> = GetErrorsToPassThroughFromPassableE<
  GetPassableErrors<AllSelfE>,
  ErrorTagsToPassThrough
>;

type GetPassableErrors<AllSelfE> = Extract<AllSelfE, TaggedMinimum>;

type GetErrorsThatWillBeRemapped<
  AllSelfE,
  ErrorTagsToPassThrough extends TagMinimum,
> = Exclude<
  AllSelfE,
  GetErrorsToPassThroughFromAllE<AllSelfE, ErrorTagsToPassThrough>
>;

type TaggedMinimum = { _tag: TagMinimum };
type TagMinimum = string | number | symbol;
