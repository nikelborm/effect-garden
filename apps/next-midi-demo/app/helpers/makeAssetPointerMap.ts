import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Iterable from 'effect/Iterable'

import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../domain/AssetPointer.ts'
import { AllChords } from '../domain/Chord.ts'
import { AllPatterns } from '../domain/Pattern.ts'
import { AllStrengths } from '../domain/Strength.ts'

export const makeAssetPointerMapFactory = Effect.gen(function* () {
  const [chords, patterns, strengths] = yield* Effect.all([
    AllChords,
    AllPatterns,
    AllStrengths,
  ])

  return <TValue>(
    getValue: (asset: AssetPointer) => TValue,
  ): HashMap.HashMap<AssetPointer, TValue> =>
    pipe(
      Iterable.cartesian(chords, strengths),
      Iterable.flatMap(([chord, strength]) =>
        Iterable.appendAll(
          Iterable.of(TaggedSlowStrumPointer.makeSimple(chord, strength)),
          Iterable.map(patterns, pattern =>
            TaggedPatternPointer.makeSimple(pattern, chord, strength),
          ),
        ),
      ),
      Iterable.map(asset => [asset, getValue(asset)] as const),
      HashMap.fromIterable,
    )
})
