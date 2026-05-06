import * as Data from 'effect/Data'

import type { Strength } from '../audioAssetHelpers.ts'

export class StrengthData extends Data.TaggedClass('next-midi-demo/Strength')<{
  value: Strength
}> {
  constructor(strength: string) {
    if (strength !== 's' && strength !== 'm' && strength !== 'v')
      throw new Error(
        `StrengthData expected strength ('s' | 'm' | 'v'), but got: ${JSON.stringify(strength)}`,
      )
    super({ value: strength })
  }
}
