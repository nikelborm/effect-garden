import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'

import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'
import type { AccordIndexData } from './Accord.ts'
import type * as ButtonState from './ButtonState.ts'
import type { NoteIdData } from './MIDIValues.ts'
import type { ParamButtonIdData } from './ParamButton.ts'
import type { PatternIndexData } from './Pattern.ts'
import type { KeyboardPhysicalButtonIdData } from './StoreValues.ts'
import type { StrengthData } from './Strength.ts'

export type PhysicalButtonId = Brand.Brand<'PhysicalButtonId'>
export const PhysicalButtonId = Brand.nominal<PhysicalButtonId>()

export type HtmlDomButton = PhysicalButtonId & Brand.Brand<'HTML DOM button'>

// TODO: types unused??
export type AccordHtmlDomButtonIdData = AccordIndexData & HtmlDomButton
export type PatternHtmlDomButtonIdData = PatternIndexData & HtmlDomButton
export type StrengthHtmlDomButtonIdData = StrengthData & HtmlDomButton

// export type AccordNoteIdData =
// export type PatternNoteIdData =
// export type StrengthNoteIdData =

export type SupportedPhysicalButtonId =
  | KeyboardPhysicalButtonIdData
  | NoteIdData
  | AccordHtmlDomButtonIdData
  | PatternHtmlDomButtonIdData
  | StrengthHtmlDomButtonIdData

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
