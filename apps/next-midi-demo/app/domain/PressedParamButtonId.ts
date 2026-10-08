import * as Effect from 'effect/Effect'

import { AccordData } from './Accord.ts'
import { PatternData } from './Pattern.ts'
import { StrengthData } from './Strength.ts'

export type PressedParamButtonId = AccordData | PatternData | StrengthData

export const matchParamButtonId =
  <TId extends PressedParamButtonId>(id: TId) =>
  <
    OnAccordReturn extends Effect.Effect<any, any, any>,
    OnPatternReturn extends Effect.Effect<any, any, any>,
    OnStrengthReturn extends Effect.Effect<any, any, any>,
  >({
    onAccord,
    onPattern,
    onStrength,
  }: ParamButtonIdMatchConfig<
    TId,
    OnAccordReturn,
    OnPatternReturn,
    OnStrengthReturn
  >): Effect.Effect<
    | (TId extends AccordData<any> ? Effect.Success<OnAccordReturn> : never)
    | (TId extends PatternData<any> ? Effect.Success<OnPatternReturn> : never)
    | (TId extends StrengthData<any>
        ? Effect.Success<OnStrengthReturn>
        : never),
    | (TId extends AccordData<any> ? Effect.Error<OnAccordReturn> : never)
    | (TId extends PatternData<any> ? Effect.Error<OnPatternReturn> : never)
    | (TId extends StrengthData<any> ? Effect.Error<OnStrengthReturn> : never),
    | (TId extends AccordData<any> ? Effect.Services<OnAccordReturn> : never)
    | (TId extends PatternData<any> ? Effect.Services<OnPatternReturn> : never)
    | (TId extends StrengthData<any>
        ? Effect.Services<OnStrengthReturn>
        : never)
  > => {
    if (AccordData.models(id) && typeof onAccord === 'function')
      return onAccord(id)
    if (PatternData.models(id) && typeof onPattern === 'function')
      return onPattern(id)
    if (StrengthData.models(id) && typeof onStrength === 'function')
      return onStrength(id)

    return Effect.die(
      new Error(
        'Invariant failed: unknown param button id type or missing callback',
      ),
    )
  }

export type ParamButtonIdMatchConfig<
  TId extends PressedParamButtonId,
  OnAccordReturn,
  OnPatternReturn,
  OnStrengthReturn,
> = (TId extends AccordData<any>
  ? { onAccord: (data: TId) => OnAccordReturn }
  : { onAccord?: never }) &
  (TId extends PatternData<any>
    ? { onPattern: (data: TId) => OnPatternReturn }
    : { onPattern?: never }) &
  (TId extends StrengthData<any>
    ? { onStrength: (data: TId) => OnStrengthReturn }
    : { onStrength?: never })
