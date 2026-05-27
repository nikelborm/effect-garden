import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'

import type { PatternIndexUnion } from '../audioAssetHelpers.ts'
import { ParamButtonIdData, type TaggedReadonlyObject } from './ParamButton.ts'

export type PatternIndex<Index extends PatternIndexUnion = PatternIndexUnion> =
  Brand.Branded<Index, 'PatternIndex: integer in range 0...7'>
export const PatternIndex = Brand.refined<PatternIndex>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 8,
  n => Brand.error(`Expected ${n} to be an integer in range 0...7`),
) as {
  <TIndex extends PatternIndexUnion = PatternIndexUnion>(
    i: TIndex,
  ): PatternIndex<TIndex>

  option<TIndex extends PatternIndexUnion = PatternIndexUnion>(
    i: TIndex,
  ): Option.Option<PatternIndex<TIndex>>

  either<TIndex extends PatternIndexUnion = PatternIndexUnion>(
    i: TIndex,
  ): Either.Either<PatternIndex<TIndex>, Brand.Brand.BrandErrors>

  is<TIndex extends number = number>(
    i: TIndex,
  ): i is TIndex & PatternIndexUnion & PatternIndex<TIndex & PatternIndexUnion>
}

export class PatternIndexData<
  TIndex extends PatternIndexUnion = PatternIndexUnion,
> extends Data.TaggedClass('next-midi-demo/PatternIndex')<{
  value: PatternIndex<TIndex>
}> {
  constructor(index: TIndex) {
    super({ value: PatternIndex(index) })
  }

  static makeUnsafe = (index: number) =>
    new PatternIndexData(index as PatternIndexUnion)

  static models = (pid: unknown): pid is PatternIndexData =>
    pid instanceof PatternIndexData
}

export class PatternParamButtonData<
  TIndex extends PatternIndexUnion = PatternIndexUnion,
> extends ParamButtonIdData<PatternIndexData> {
  constructor(index: TIndex) {
    super(new PatternIndexData(index))
  }

  static override makeUnsafeFromData = (
    idData: TaggedReadonlyObject,
  ): ParamButtonIdData<PatternIndexData> => {
    if (PatternIndexData.models(idData))
      return Object.setPrototypeOf(
        new ParamButtonIdData(idData),
        PatternParamButtonData,
      )

    throw new Error(
      'Cannot create PatternParamButtonData. argument is not PatternIndexData',
    )
  }

  static makeUnsafe = (index: number) =>
    new PatternParamButtonData(index as PatternIndexUnion)
}

export class Pattern<
  const TLabel extends string = string,
  TIndex extends PatternIndexUnion = PatternIndexUnion,
> extends Data.TaggedClass('next-midi-demo/Pattern')<{
  readonly label: TLabel
  readonly index: PatternIndex<TIndex>
}> {
  constructor(label: TLabel, index: TIndex) {
    super({ label, index: PatternIndex(index) })
  }

  static makeUnsafe = <const TLabel extends string = string>(
    label: TLabel,
    index: number,
  ) => new Pattern(label, index as PatternIndexUnion)

  static models = (p: unknown): p is Pattern => p instanceof Pattern
}
