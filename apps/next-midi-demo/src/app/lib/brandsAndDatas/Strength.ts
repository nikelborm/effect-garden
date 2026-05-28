import * as Data from 'effect/Data'

import type { Strength } from '../audioAssetHelpers.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'
import { ParamButtonIdData } from './ParamButton.ts'

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

  static models = (s: unknown): s is StrengthData => s instanceof StrengthData
}

export class StrengthParamButtonData<
  TStrength extends Strength = Strength,
> extends ParamButtonIdData<StrengthData> {
  constructor(strength: TStrength) {
    super(new StrengthData(strength))
  }

  static override makeUnsafeFromData = (
    idData: TaggedReadonlyObject,
  ): ParamButtonIdData<StrengthData> => {
    if (StrengthData.models(idData))
      return Object.setPrototypeOf(
        new ParamButtonIdData(idData),
        StrengthParamButtonData,
      )

    throw new Error(
      'Cannot create StrengthParamButtonData. argument is not StrengthData',
    )
  }

  static makeUnsafe = (strength: string) =>
    new StrengthParamButtonData(strength as Strength)
}
