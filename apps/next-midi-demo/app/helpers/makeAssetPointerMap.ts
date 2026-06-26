import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Iterable from 'effect/Iterable'

import { AllAccords } from '../domain/Accord.ts'
import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../domain/AssetPointer.ts'
import { AllPatterns } from '../domain/Pattern.ts'
import { AllStrengths } from '../domain/Strength.ts'

export const makeAssetPointerMapFactory = Effect.gen(function* () {
  const [accords, patterns, strengths] = yield* Effect.all([
    AllAccords,
    AllPatterns,
    AllStrengths,
  ])

  return <TValue>(
    getValue: (asset: AssetPointer) => TValue,
  ): HashMap.HashMap<AssetPointer, TValue> =>
    pipe(
      Iterable.cartesian(accords, strengths),
      Iterable.flatMap(([accord, strength]) =>
        Iterable.appendAll(
          Iterable.of(TaggedSlowStrumPointer.make({ accord, strength })),
          Iterable.map(patterns, pattern =>
            TaggedPatternPointer.make({ pattern, accord, strength }),
          ),
        ),
      ),
      Iterable.map(asset => [asset, getValue(asset)] as const),
      HashMap.fromIterable,
    )
})
