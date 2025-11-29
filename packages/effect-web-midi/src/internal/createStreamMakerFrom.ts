import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as Stream from 'effect/Stream'

/**
 * @internal
 */
const validOnNullStrategies = new Set([
  'fail',
  'die',
  'ignore',
  'passthrough',
] as const)

/**
 * @internal
 */
export const createStreamMakerFrom =
  <TEventTypeToEventValueMap extends object>() =>
  <
    TEventTarget extends Stream.EventListener<
      TEventTypeToEventValueMap[TSelectedEventType]
    >,
    const TSelectedEventType extends Extract<
      keyof TEventTypeToEventValueMap,
      string
    >,
    const TNullableFieldName extends Extract<
      keyof TEventTypeToEventValueMap[TSelectedEventType],
      string
    >,
    TCameFrom,
    const TTag extends string,
    TContainerWithNullableFields extends object,
  >(
    isSelf: (self: unknown) => self is TCameFrom,
    buildConfig: (self: TCameFrom) => {
      tag: TTag
      eventListener: { target: TEventTarget; type: TSelectedEventType }
      spanAttributes: { spanTargetName: string; [k: string]: unknown }
      nullableFieldName: TNullableFieldName
    },
    remapValueToContainer: (
      fieldValue: TEventTypeToEventValueMap[TSelectedEventType][TNullableFieldName],
    ) => TContainerWithNullableFields,
  ): StreamMaker<TCameFrom, TTag, TContainerWithNullableFields> =>
    dual(
      isSelf,
      (cameFrom: TCameFrom, options?: StreamMakerOptions<OnNullStrategy>) => {
        const {
          tag,
          eventListener: { target, type },
          spanAttributes,
          nullableFieldName: field,
        } = buildConfig(cameFrom)

        const onNullStrategy = ((
          options as { onExtremelyRareNullableField?: OnNullStrategy }
        )?.onExtremelyRareNullableField ?? 'die') as Exclude<
          OnNullStrategy,
          undefined
        >

        if (!validOnNullStrategies.has(onNullStrategy))
          throw new Error(
            `Invalid strategy to handle nullish values: ${onNullStrategy}`,
          )

        const missingFieldMessage = `Property ${field} of ${tag} is null`
        const NullCausedErrorEffect = new Cause.NoSuchElementException(
          missingFieldMessage,
        )

        return Stream.fromEventListener(target, type, options).pipe(
          Stream.filter(event => !!event[field] || onNullStrategy !== 'ignore'),
          Stream.mapEffect(event =>
            event[field] || onNullStrategy === 'passthrough'
              ? Effect.succeed({
                  _tag: tag,
                  ...remapValueToContainer(event[field]),
                  cameFrom,
                  capturedAt: new Date(),
                })
              : onNullStrategy === 'fail'
                ? NullCausedErrorEffect
                : Effect.dieMessage(missingFieldMessage),
          ),
          Stream.withSpan('MIDI Web API event stream', {
            kind: 'producer',
            attributes: { eventType: type, ...spanAttributes },
          }),
        )
      },
    )

/**
 * @internal
 */
export const makeStreamFromWrapped = <
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
>(
  makeStream: StreamMaker<TCameFrom, TTag, TContainerWithNullableFields>,
): StreamMakerFromWrapped<TCameFrom, TTag, TContainerWithNullableFields> =>
  dual(Effect.isEffect, (self, options) =>
    self.pipe(Effect.map(makeStream(options)), Stream.unwrap),
  )

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

export type OnNullStrategy =
  | (typeof validOnNullStrategies extends Set<infer U> ? U : never)
  | undefined

export type StreamValue<
  TTag extends string,
  TCameFrom,
  TContainerWithNullableFields extends object,
  TOnNullStrategy extends OnNullStrategy,
> = {
  readonly _tag: TTag
  readonly cameFrom: TCameFrom
  readonly capturedAt: Date
} & (
  | {
      readonly [k in keyof TContainerWithNullableFields]: Exclude<
        TContainerWithNullableFields[k],
        null
      >
    }
  | ([TOnNullStrategy] extends ['passthrough']
      ? {
          readonly [k in keyof TContainerWithNullableFields]: null
        }
      : never)
)

export type StreamError<TOnNullStrategy extends OnNullStrategy, TE> =
  | TE
  | ([TOnNullStrategy] extends ['fail'] ? Cause.NoSuchElementException : never)

export interface BuiltStream<
  TTag extends string,
  TCameFrom,
  TContainerWithNullableFields extends object,
  TOnNullStrategy extends OnNullStrategy,
  TE = never,
  TR = never,
> extends Stream.Stream<
    StreamValue<TTag, TCameFrom, TContainerWithNullableFields, TOnNullStrategy>,
    StreamError<TOnNullStrategy, TE>,
    TR
  > {}

export interface StreamMaker<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> {
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): (
    self: TCameFrom,
  ) => BuiltStream<
    TTag,
    TCameFrom,
    TContainerWithNullableFields,
    TOnNullStrategy
  >
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    self: TCameFrom,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): BuiltStream<TTag, TCameFrom, TContainerWithNullableFields, TOnNullStrategy>
}

export interface StreamMakerFromWrapped<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> {
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): <E, R>(
    self: Effect.Effect<TCameFrom, E, R>,
  ) => BuiltStream<
    TTag,
    TCameFrom,
    TContainerWithNullableFields,
    TOnNullStrategy,
    E,
    R
  >

  <E, R, const TOnNullStrategy extends OnNullStrategy = undefined>(
    self: Effect.Effect<TCameFrom, E, R>,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): BuiltStream<
    TTag,
    TCameFrom,
    TContainerWithNullableFields,
    TOnNullStrategy,
    E,
    R
  >
}
