import { AccordData } from '../domain/Accord.ts'
import type {
  AssetPointer,
  TaggedPatternPointer,
} from '../domain/AssetPointer.ts'
import { PatternData } from '../domain/Pattern.ts'
import type { PressedParamButtonId } from '../domain/PressedParamButtonId.ts'
import { StrengthData } from '../domain/Strength.ts'

export const theSameAccordWasPressed = <T extends PressedParamButtonId>(
  pressedParamButtonId: T,
  asset: AssetPointer,
): pressedParamButtonId is T & AccordData =>
  AccordData.models(pressedParamButtonId) &&
  pressedParamButtonId.accord === asset.accord

export const theSameStrengthWasPressed = <T extends PressedParamButtonId>(
  pressedParamButtonId: T,
  asset: AssetPointer,
): pressedParamButtonId is T & StrengthData =>
  StrengthData.models(pressedParamButtonId) &&
  pressedParamButtonId.strength === asset.strength

export const theSamePatternWasPressed = <T extends PressedParamButtonId>(
  pressedParamButtonId: T,
  asset: TaggedPatternPointer,
): pressedParamButtonId is T & PatternData =>
  PatternData.models(pressedParamButtonId) &&
  pressedParamButtonId.pattern === asset.pattern

export const theSameAccordOrStrengthWasPressed = <
  T extends PressedParamButtonId,
>(
  pressedParamButtonId: T,
  asset: AssetPointer,
): pressedParamButtonId is T & (AccordData | StrengthData) =>
  theSameAccordWasPressed(pressedParamButtonId, asset) ||
  theSameStrengthWasPressed(pressedParamButtonId, asset)
