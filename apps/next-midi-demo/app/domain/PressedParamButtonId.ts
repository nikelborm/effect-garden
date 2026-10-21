import * as Arbitrary from 'effect/Arbitrary'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { ChordData } from './Chord.ts'
import { PatternData } from './Pattern.ts'
import { StrengthData } from './Strength.ts'

export type PressedParamButtonId = ChordData | PatternData | StrengthData

export const PressedParamButtonIdArbitrary: Arbitrary.Arbitrary<PressedParamButtonId> =
  Arbitrary.schema(Schema.Union([ChordData, PatternData, StrengthData]))

export const matchParamButtonId =
  <TId extends PressedParamButtonId>(id: TId) =>
  <
    OnChordReturn extends Effect.Effect<any, any, any>,
    OnPatternReturn extends Effect.Effect<any, any, any>,
    OnStrengthReturn extends Effect.Effect<any, any, any>,
  >({
    onChord,
    onPattern,
    onStrength,
  }: ParamButtonIdMatchConfig<
    TId,
    OnChordReturn,
    OnPatternReturn,
    OnStrengthReturn
  >): Effect.Effect<
    ParamButtonIdMatchSuccess<
      TId,
      OnChordReturn,
      OnPatternReturn,
      OnStrengthReturn
    >,
    ParamButtonIdMatchError<
      TId,
      OnChordReturn,
      OnPatternReturn,
      OnStrengthReturn
    >,
    ParamButtonIdMatchServices<
      TId,
      OnChordReturn,
      OnPatternReturn,
      OnStrengthReturn
    >
  > => {
    if (ChordData.models(id) && typeof onChord === 'function')
      return onChord(id)
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
  OnChordReturn,
  OnPatternReturn,
  OnStrengthReturn,
> = (TId extends ChordData
  ? { onChord: (data: TId) => OnChordReturn }
  : { onChord?: never }) &
  (TId extends PatternData
    ? { onPattern: (data: TId) => OnPatternReturn }
    : { onPattern?: never }) &
  (TId extends StrengthData
    ? { onStrength: (data: TId) => OnStrengthReturn }
    : { onStrength?: never })

export type ParamButtonIdMatchSuccess<
  TId extends PressedParamButtonId,
  OnChordReturn,
  OnPatternReturn,
  OnStrengthReturn,
> =
  | (TId extends ChordData ? Effect.Success<OnChordReturn> : never)
  | (TId extends PatternData ? Effect.Success<OnPatternReturn> : never)
  | (TId extends StrengthData ? Effect.Success<OnStrengthReturn> : never)

export type ParamButtonIdMatchError<
  TId extends PressedParamButtonId,
  OnChordReturn,
  OnPatternReturn,
  OnStrengthReturn,
> =
  | (TId extends ChordData ? Effect.Error<OnChordReturn> : never)
  | (TId extends PatternData ? Effect.Error<OnPatternReturn> : never)
  | (TId extends StrengthData ? Effect.Error<OnStrengthReturn> : never)

export type ParamButtonIdMatchServices<
  TId extends PressedParamButtonId,
  OnChordReturn,
  OnPatternReturn,
  OnStrengthReturn,
> =
  | (TId extends ChordData ? Effect.Services<OnChordReturn> : never)
  | (TId extends PatternData ? Effect.Services<OnPatternReturn> : never)
  | (TId extends StrengthData ? Effect.Services<OnStrengthReturn> : never)
