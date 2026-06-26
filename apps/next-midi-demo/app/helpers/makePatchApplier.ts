import type { AccordData } from '../domain/Accord.ts'
import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../domain/AssetPointer.ts'
import { PatternData } from '../domain/Pattern.ts'
import type { StrengthData } from '../domain/Strength.ts'

export const makePatchApplier =
  (patch: Patch) =>
  (old: AssetPointer): AssetPointer =>
    (TaggedPatternPointer.models(old) || PatternData.models(patch)
      ? TaggedPatternPointer
      : TaggedSlowStrumPointer
    ).make({ ...old, ...patch } as any)

export type Patch = PatternData | AccordData | StrengthData
