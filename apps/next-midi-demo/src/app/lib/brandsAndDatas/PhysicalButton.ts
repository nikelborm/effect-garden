import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'

import { isData } from '../helpers/isData.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'
import type { AccordIndexData } from './Accord.ts'
import type * as ButtonState from './ButtonState.ts'
import type { NoteIdData } from './MIDIValues.ts'
import type { ParamButtonIdData } from './ParamButton.ts'
// import type { ParamButtonIdData } from './ParamButton.ts'
import type { PatternIndexData } from './Pattern.ts'
import type { StrengthData } from './Strength.ts'

// export type HtmlDomButton = PhysicalButtonId & Brand.Brand<'HTML DOM button'>

// TODO: types unused??
// export type AccordHtmlDomButtonIdData = AccordIndexData & HtmlDomButton
// export type PatternHtmlDomButtonIdData = PatternIndexData & HtmlDomButton
// export type StrengthHtmlDomButtonIdData = StrengthData & HtmlDomButton

// export type AccordNoteIdData =
// export type PatternNoteIdData =
// export type StrengthNoteIdData =

export type PhysicalButtonId<T extends string | number> = T extends any
  ? Brand.Branded<T, 'PhysicalButtonId'>
  : never

export const PhysicalButtonId = Brand.refined<
  PhysicalButtonId<string | number>
>(
  t =>
    (typeof t === 'number' && !Number.isNaN(t) && Number.isFinite(t)) ||
    (typeof t === 'string' && t !== ''),
  t =>
    Brand.error(
      `Expected PhysicalButtonId which is either finite non-NaN number, or non-empty string. Got ${t}`,
    ),
) as {
  readonly [Brand.RefinedConstructorsTypeId]: Brand.RefinedConstructorsTypeId
  <T extends string | number = string | number>(i: T): PhysicalButtonId<T>
  option<T extends string | number = string | number>(
    i: T,
  ): Option.Option<PhysicalButtonId<T>>
  either<T extends string | number = string | number>(
    i: T,
  ): Either.Either<PhysicalButtonId<T>, Brand.Brand.BrandErrors>
  is<T extends string | number = string | number>(
    i: T,
  ): i is T & PhysicalButtonId<T>
}

export class PhysicalButtonIdData<
  TId extends TaggedReadonlyObject = TaggedReadonlyObject,
> extends Data.TaggedClass('next-midi-demo/PhysicalButtonId')<{ id: TId }> {
  constructor(id: TId) {
    super({ id })
  }

  static makeUnsafeFromData = (
    idData: TaggedReadonlyObject,
  ): PhysicalButtonIdData<TaggedReadonlyObject> => {
    if (isData(idData)) return new PhysicalButtonIdData(idData)

    throw new Error(
      "Cannot create PhysicalButtonIdData. Argument doesn't pass as effect/Data.TaggedClass instance",
    )
  }
}

export class PhysicalButtonModel<
  TParamButtonId extends TaggedReadonlyObject,
> extends Data.Class<{
  buttonPressState: ButtonState.AllSimple
  assignedToParamButtonId: ParamButtonIdData<TParamButtonId>
}> {
  constructor(
    buttonPressState: ButtonState.AllSimple,
    assignedToParamButtonId: ParamButtonIdData<TParamButtonId>,
  ) {
    super({ buttonPressState, assignedToParamButtonId })
  }
}
