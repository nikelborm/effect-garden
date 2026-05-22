import type * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'

import type { AccordIndexData } from './Accord.ts'
import type * as ButtonState from './ButtonState.ts'
import type { NoteIdData } from './MIDIValues.ts'
import type { PatternIndexData } from './Pattern.ts'
import type { KeyboardPhysicalButtonIdData } from './StoreValues.ts'
import type { StrengthData } from './Strength.ts'

export type HtmlDomButtonBrand = Brand.Brand<'HTML DOM button'>
export type AccordHtmlDomButtonIdData = AccordIndexData & HtmlDomButtonBrand
export type PatternHtmlDomButtonIdData = PatternIndexData & HtmlDomButtonBrand
export type StrengthHtmlDomButtonIdData = StrengthData & HtmlDomButtonBrand

export type SupportedPhysicalButtonId =
  | KeyboardPhysicalButtonIdData
  | NoteIdData
  | AccordHtmlDomButtonIdData
  | PatternHtmlDomButtonIdData
  | StrengthHtmlDomButtonIdData

export class PhysicalButtonModel<TAssignedToParamButton> extends Data.Class<{
  buttonPressState: ButtonState.AllSimple
  assignedToParamButton: TAssignedToParamButton
}> {
  constructor(
    buttonPressState: ButtonState.AllSimple,
    assignedToParamButton: TAssignedToParamButton,
  ) {
    super({ buttonPressState, assignedToParamButton })
  }
}
