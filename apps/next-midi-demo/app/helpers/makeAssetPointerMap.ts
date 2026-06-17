import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Iterable from 'effect/Iterable'

import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../brandsAndDatas/AssetPointer.ts'
import { AccordRegistry } from '../services/AccordRegistry.ts'
import { PatternRegistry } from '../services/PatternRegistry.ts'
import { StrengthRegistry } from '../services/StrengthRegistry.ts'

export const makeAssetPointerMapFactory = Effect.gen(function* () {
  const [accords, patterns, strengths] = yield* Effect.all([
    AccordRegistry.allAccords,
    PatternRegistry.allPatterns,
    StrengthRegistry.allStrengths,
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
