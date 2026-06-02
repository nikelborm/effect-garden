import type { AccordData } from '../brandsAndDatas/Accord.ts'
import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../brandsAndDatas/AssetPointer.ts'
import { PatternData } from '../brandsAndDatas/Pattern.ts'
import type { StrengthData } from '../brandsAndDatas/Strength.ts'

export const makePatchApplier =
  (patch: Patch) =>
  (old: AssetPointer): AssetPointer =>
    (TaggedPatternPointer.models(old) || PatternData.models(patch)
      ? TaggedPatternPointer
      : TaggedSlowStrumPointer
    ).make({ ...old, ...patch } as any)

export type Patch = PatternData | AccordData | StrengthData
