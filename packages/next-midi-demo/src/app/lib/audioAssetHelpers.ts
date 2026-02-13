import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

export type AssetPointer = TaggedPatternPointer | TaggedSlowStrumPointer

export const StrengthSchema = Schema.Literal('s', 'm', 'v')
export type Strength = (typeof StrengthSchema)['Type']

export class TaggedPatternPointer extends Schema.TaggedClass<TaggedPatternPointer>()(
  'pattern',
  {
    strength: StrengthSchema,
  },
) {}

export type PatternPointer = Omit<TaggedPatternPointer, '_tag'>

export class TaggedSlowStrumPointer extends Schema.TaggedClass<TaggedSlowStrumPointer>()(
  'slow_strum',
  {
    strength: StrengthSchema,
  },
) {}

export const RECORDED_ACCORDS = [
  'C',
  'Dm',
  'Em',
  'F',
  'G',
  'Am',
  'D',
  'E',
] as const

export type RecordedAccordsTuple = typeof RECORDED_ACCORDS

export type TupleIndices<T extends readonly any[]> =
  Extract<keyof T, `${number}`> extends `${infer N extends number}` ? N : never

export type RecordedAccordIndexes = TupleIndices<RecordedAccordsTuple>

export type RecordAccordNames = RecordedAccordsTuple[RecordedAccordIndexes]

export type RecordedPatternIndexes = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type StringToArray<T extends string> =
  T extends `${infer Character}${infer Rest}`
    ? [Character, ...StringToArray<Rest>]
    : []

export type GetPaddedAccordName<
  SelectedAccordIndex extends RecordedAccordIndexes,
> = RecordedAccordsTuple[SelectedAccordIndex] extends infer A extends string
  ? StringToArray<A>['length'] extends infer L extends number
    ? L extends 2
      ? A
      : L extends 1
        ? `${A}_`
        : never
    : never
  : never

export type RemotePatternAssetFileName<
  SelectedAccordIndex extends RecordedAccordIndexes,
  SelectedPatternIndex extends RecordedPatternIndexes,
  SelectedStrength extends Strength,
> = `/samples/pattern_${SelectedPatternIndex}/accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

export type RemoteSlowStrumAssetFileName<
  SelectedAccordIndex extends RecordedAccordIndexes,
  SelectedStrength extends Strength,
> = `/samples/slow_strum/accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

export type RemoteAssetPath<Asset extends AssetPointer> = string

export const getRemoteAssetPath = <Asset extends AssetPointer>(
  asset: Asset,
): RemoteAssetPath<Asset> => 'string'

export type LocalPatternAssetFileName<
  SelectedAccordIndex extends RecordedAccordIndexes,
  SelectedPatternIndex extends RecordedPatternIndexes,
  SelectedStrength extends Strength,
> = `pattern_${SelectedPatternIndex}_accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

export type LocalSlowStrumAssetFileName<
  SelectedAccordIndex extends RecordedAccordIndexes,
  SelectedStrength extends Strength,
> = `slow_strum_accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

export const getLocalAssetFileName = <Asset extends AssetPointer>(
  asset: Asset,
): string => 'string'

export const getLocalAssetFilePath = <Asset extends AssetPointer>(
  asset: Asset,
): string => 'string'

const localPatternAssetFileNameRegExp =
  /^pattern_(?<patternIndex>\d)_accord_(?<accordIndex>\d)_(?:[A-G][m#b]?_?)_strength_(?<strength>s|m|v)\.wav$/

const localSlowStrumAssetFileNameRegExp =
  /^slow_strum_accord_(?<accordIndex>\d)_(?:[A-G][m#b]?_?)_strength_(?<strength>s|m|v)\.wav$/

export const getAssetFromLocalFileName = (
  fileName: string,
): Option.Option<AssetPointer> => {
  let { patternIndex, accordIndex, strength } =
    fileName.match(localPatternAssetFileNameRegExp)?.groups || {}

  if (patternIndex && accordIndex && strength)
    return Option.some(
      new TaggedPatternPointer({
        strength: strength as Strength,
      }),
    )

  ;({ accordIndex, strength } =
    fileName.match(localSlowStrumAssetFileNameRegExp)?.groups || {})

  if (accordIndex && strength)
    return Option.some(
      new TaggedSlowStrumPointer({
        strength: strength as Strength,
      }),
    )

  return Option.none()
}
