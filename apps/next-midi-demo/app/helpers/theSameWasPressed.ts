import type {
  AssetPointer,
  TaggedPatternPointer,
} from '../domain/AssetPointer.ts'
import { ChordData } from '../domain/Chord.ts'
import { PatternData } from '../domain/Pattern.ts'
import type { PressedParamButtonId } from '../domain/PressedParamButtonId.ts'
import { StrengthData } from '../domain/Strength.ts'

export const theSameChordWasPressed = (
  pressedParamButtonId: PressedParamButtonId,
  asset: AssetPointer,
): boolean =>
  ChordData.models(pressedParamButtonId) &&
  pressedParamButtonId.chord === asset.chord

export const theSameStrengthWasPressed = (
  pressedParamButtonId: PressedParamButtonId,
  asset: AssetPointer,
): boolean =>
  StrengthData.models(pressedParamButtonId) &&
  pressedParamButtonId.strength === asset.strength

export const theSamePatternWasPressed = (
  pressedParamButtonId: PressedParamButtonId,
  asset: TaggedPatternPointer,
): boolean =>
  PatternData.models(pressedParamButtonId) &&
  pressedParamButtonId.pattern === asset.pattern

export const theSameChordOrStrengthWasPressed = (
  pressedParamButtonId: PressedParamButtonId,
  asset: AssetPointer,
): boolean =>
  theSameChordWasPressed(pressedParamButtonId, asset) ||
  theSameStrengthWasPressed(pressedParamButtonId, asset)
