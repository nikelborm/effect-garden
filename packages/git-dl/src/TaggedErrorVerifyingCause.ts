import type { Equals } from 'tsafe'

import type { YieldableError } from 'effect/Cause'
import { TaggedError } from 'effect/Data'
import { isFunction } from 'effect/Predicate'

const removeLastIfItIsEmptyObject = (arr: Array<unknown>) =>
  Object.keys(arr.at(-1) ?? {}).length ? arr : arr.slice(0, -1)

export const buildTaggedErrorClassVerifyingCause =
  <const DynamicContext extends Record<string, unknown> = {}>() =>
  <
    const ErrorName extends string,
    Config extends {
      ErrorName: ErrorName
      ExpectedCauseClass: ExpectedCauseClass
      StaticContext: StaticContext
      DynamicContext: DynamicContext
    },
    const StaticContext extends Record<string, unknown> = {},
    ExpectedCauseClass extends WideErrorConstructor | undefined = undefined,
  >(
    errorName: ErrorName,
    customMessage: string | ((...args: MessageRendererArgs<Config>) => string),
    expectedCauseClass?: ExpectedCauseClass,
    staticContext?: StaticContext,
  ): TaggedErrorClass<Config> => {
    // TODO: Consider using Schema.TaggedError instead of Data.TaggedError
    const CustomTaggedErrorClass = TaggedError(errorName)<
      Record<'message' | '_tag' | 'name', unknown>
    >

    class Base extends CustomTaggedErrorClass {
      constructor(...args: ConstructorArgs<Config>) {
        if (expectedCauseClass && !(args[0] instanceof expectedCauseClass))
          throw new Error(
            `Provided cause of incorrect type to "${
              errorName
            }" class. Expected cause class: "${expectedCauseClass.name}"`,
          )

        const customMessageRendererArgs = removeLastIfItIsEmptyObject(
          expectedCauseClass
            ? [args[0], { ...(args[1] ?? {}), ...staticContext }]
            : [{ ...(args[0] ?? {}), ...staticContext }],
        ) as MessageRendererArgs<Config>

        super({
          name: errorName,
          message: isFunction(customMessage)
            ? customMessage(...customMessageRendererArgs)
            : customMessage,
          ...(!!expectedCauseClass && { cause: args[0] }),
          ...staticContext,
          ...(args[+!!expectedCauseClass] ?? {}), // dynamic context
        })
      }
    }

    return Base as TaggedErrorClass<Config>
  }

export type TaggedErrorClass<Config extends ConfigTemplate> = [string] extends [
  Config['ErrorName'],
]
  ? 'ErrorName should be a string literal'
  : new (
      ...args: ConstructorArgs<Config>
    ) => YieldableError &
      Readonly<
        {
          message: string
          _tag: Config['ErrorName']
          name: Config['ErrorName']
        } & GetValueByKey<Config, 'DynamicContext', {}> &
          GetValueByKey<Config, 'StaticContext', {}> &
          IsExpectedCauseClassManuallySpecified<
            Config,
            { cause: GetCauseInstance<Config> },
            {}
          >
      >

type ConstructorArgs<Config extends ConfigTemplate> = CauseArgTuple<
  Config,
  GetValueByKey<Config, 'DynamicContext', {}>
>

type MessageRendererArgs<Config extends ConfigTemplate> = CauseArgTuple<
  Config,
  GetValueByKey<Config, 'DynamicContext', {}> &
    GetValueByKey<Config, 'StaticContext', {}>
>

type ConfigTemplate = {
  ErrorName: string
  ExpectedCauseClass?: WideErrorConstructor | undefined
  StaticContext?: Record<string, unknown> | undefined
  DynamicContext?: Record<string, unknown> | undefined
}

type CauseArgTuple<Config extends ConfigTemplate, Context> = [
  ...IsExpectedCauseClassManuallySpecified<
    Config,
    [cause: GetCauseInstance<Config>],
    []
  >,
  ...(Equals<Context, {}> extends true ? [] : [context: Readonly<Context>]),
]

type IsExpectedCauseClassManuallySpecified<
  Config extends ConfigTemplate,
  IfTrue,
  IfFalse,
> = GetValueByKey<
  Config,
  'ExpectedCauseClass',
  WideErrorConstructor | undefined
> extends infer ExpectedCauseClass
  ? [ExpectedCauseClass] extends [WideErrorConstructor]
    ? IfTrue
    : IfFalse
  : never

type GetCauseInstance<Config extends ConfigTemplate> = InstanceType<
  Exclude<Config['ExpectedCauseClass'], undefined>
>

export type GetValueByKey<
  Config extends Record<string, unknown>,
  Key extends string,
  Default,
> = [Key] extends [keyof Config]
  ? Exclude<Config[Key], undefined> extends infer TargetValue
    ? [TargetValue] extends [never]
      ? Default
      : TargetValue
    : Default
  : Default

type WideErrorConstructor = new (...args: any[]) => Error
