import type {
  AssetPointer,
  TaggedPatternPointer,
} from '../domain/AssetPointer.ts'
import { ChordData } from '../domain/Chord.ts'
import { PatternData } from '../domain/Pattern.ts'
import type { PressedParamButtonId } from '../domain/PressedParamButtonId.ts'
import { StrengthData } from '../domain/Strength.ts'

export const theSameChordWasPressed = <T extends PressedParamButtonId>(
  pressedParamButtonId: T,
  asset: AssetPointer,
): boolean =>
  ChordData.models(pressedParamButtonId) &&
  pressedParamButtonId.chord === asset.chord

export const theSameStrengthWasPressed = <T extends PressedParamButtonId>(
  pressedParamButtonId: T,
  asset: AssetPointer,
): boolean =>
  StrengthData.models(pressedParamButtonId) &&
  pressedParamButtonId.strength === asset.strength

export const theSamePatternWasPressed = <T extends PressedParamButtonId>(
  pressedParamButtonId: T,
  asset: TaggedPatternPointer,
): boolean =>
  PatternData.models(pressedParamButtonId) &&
  pressedParamButtonId.pattern === asset.pattern

export const theSameChordOrStrengthWasPressed = <
  T extends PressedParamButtonId,
>(
  pressedParamButtonId: T,
  asset: AssetPointer,
): boolean =>
  theSameChordWasPressed(pressedParamButtonId, asset) ||
  theSameStrengthWasPressed(pressedParamButtonId, asset)
