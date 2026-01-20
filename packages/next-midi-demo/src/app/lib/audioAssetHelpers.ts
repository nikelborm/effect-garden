import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

export type AssetPointer = TaggedPatternPointer | TaggedSlowStrumPointer

export class TaggedPatternPointer extends Schema.TaggedClass<TaggedPatternPointer>()(
  'pattern',
  {
    patternIndex: Schema.Literal(0, 1, 2, 3, 4, 5, 6, 7),
    accordIndex: Schema.Literal(0, 1, 2, 3, 4, 5, 6, 7),
    strength: Schema.Literal('s', 'm', 'v'),
  },
) {}

export type PatternPointer = Omit<TaggedPatternPointer, '_tag'>

export class TaggedSlowStrumPointer extends Schema.TaggedClass<TaggedSlowStrumPointer>()(
  'slow_strum',
  {
    patternIndex: Schema.Never.pipe(Schema.optionalWith({ exact: true })),
    accordIndex: Schema.Literal(0, 1, 2, 3, 4, 5, 6, 7),
    strength: Schema.Literal('s', 'm', 'v'),
  },
) {}

export type Strength = 's' | 'm' | 'v'

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

const getRemotePatternAssetFileName = <
  const SelectedAccordIndex extends RecordedAccordIndexes,
  const SelectedStrength extends Strength,
>(
  accordIndex: SelectedAccordIndex,
  strength: SelectedStrength,
) =>
  `accord_${accordIndex}_${RECORDED_ACCORDS[accordIndex].padEnd(2, '_') as GetPaddedAccordName<SelectedAccordIndex>}_strength_${strength}.wav` as const

const getRemotePatternAssetFolderName = <
  const SelectedPatternIndex extends RecordedPatternIndexes,
>(
  patternIndex: SelectedPatternIndex,
) => `pattern_${patternIndex}` as const

const getRemotePatternAssetPath = <
  const SelectedAccordIndex extends RecordedAccordIndexes,
  const SelectedPatternIndex extends RecordedPatternIndexes,
  const SelectedStrength extends Strength,
>({
  accordIndex,
  patternIndex,
  strength,
}: {
  accordIndex: SelectedAccordIndex
  patternIndex: SelectedPatternIndex
  strength: SelectedStrength
}): RemotePatternAssetFileName<
  SelectedAccordIndex,
  SelectedPatternIndex,
  SelectedStrength
> =>
  `/samples/${getRemotePatternAssetFolderName(patternIndex)}/${getRemotePatternAssetFileName(accordIndex, strength)}` as const

const getRemoteSlowStrumAssetPath = <
  const SelectedAccordIndex extends RecordedAccordIndexes,
  const SelectedStrength extends Strength,
>(
  accordIndex: SelectedAccordIndex,
  strength: SelectedStrength,
): RemoteSlowStrumAssetFileName<SelectedAccordIndex, SelectedStrength> =>
  `/samples/slow_strum/${getRemotePatternAssetFileName(accordIndex, strength)}` as const

export type RemotePatternAssetFileName<
  SelectedAccordIndex extends RecordedAccordIndexes,
  SelectedPatternIndex extends RecordedPatternIndexes,
  SelectedStrength extends Strength,
> = `/samples/pattern_${SelectedPatternIndex}/accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

export type RemoteSlowStrumAssetFileName<
  SelectedAccordIndex extends RecordedAccordIndexes,
  SelectedStrength extends Strength,
> = `/samples/slow_strum/accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

export type RemoteAssetPath<Asset extends AssetPointer> = [Asset] extends [
  TaggedPatternPointer,
]
  ? RemotePatternAssetFileName<
      Asset['accordIndex'],
      Asset['patternIndex'],
      Asset['strength']
    >
  : [Asset] extends [TaggedSlowStrumPointer]
    ? RemoteSlowStrumAssetFileName<Asset['accordIndex'], Asset['strength']>
    : string

export const getRemoteAssetPath = <Asset extends AssetPointer>(
  asset: Asset,
): RemoteAssetPath<Asset> =>
  asset._tag === 'pattern'
    ? (getRemotePatternAssetPath(asset) as any)
    : (getRemoteSlowStrumAssetPath(asset.accordIndex, asset.strength) as any)

export type LocalPatternAssetFileName<
  SelectedAccordIndex extends RecordedAccordIndexes,
  SelectedPatternIndex extends RecordedPatternIndexes,
  SelectedStrength extends Strength,
> = `pattern_${SelectedPatternIndex}_accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

export type LocalSlowStrumAssetFileName<
  SelectedAccordIndex extends RecordedAccordIndexes,
  SelectedStrength extends Strength,
> = `slow_strum_accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

const getLocalPatternAssetFileName = <
  const SelectedAccordIndex extends RecordedAccordIndexes,
  const SelectedPatternIndex extends RecordedPatternIndexes,
  const SelectedStrength extends Strength,
>({
  accordIndex,
  patternIndex,
  strength,
}: {
  accordIndex: SelectedAccordIndex
  patternIndex: SelectedPatternIndex
  strength: SelectedStrength
}): LocalPatternAssetFileName<
  SelectedAccordIndex,
  SelectedPatternIndex,
  SelectedStrength
> =>
  `${getRemotePatternAssetFolderName(patternIndex)}_${getRemotePatternAssetFileName(accordIndex, strength)}` as const

const getLocalSlowStrumAssetFileName = <
  const SelectedAccordIndex extends RecordedAccordIndexes,
  const SelectedStrength extends Strength,
>(
  accordIndex: SelectedAccordIndex,
  strength: SelectedStrength,
): LocalSlowStrumAssetFileName<SelectedAccordIndex, SelectedStrength> =>
  `slow_strum_${getRemotePatternAssetFileName(accordIndex, strength)}` as const

export type LocalAssetFileName<Asset extends AssetPointer> = [Asset] extends [
  TaggedPatternPointer,
]
  ? LocalPatternAssetFileName<
      Asset['accordIndex'],
      Asset['patternIndex'],
      Asset['strength']
    >
  : [Asset] extends [TaggedSlowStrumPointer]
    ? LocalSlowStrumAssetFileName<Asset['accordIndex'], Asset['strength']>
    : string

export const getLocalAssetFileName = <Asset extends AssetPointer>(
  asset: Asset,
): LocalAssetFileName<Asset> =>
  asset._tag === 'pattern'
    ? (getLocalPatternAssetFileName(asset) as any)
    : (getLocalSlowStrumAssetFileName(asset.accordIndex, asset.strength) as any)

export const getLocalAssetFilePath = <Asset extends AssetPointer>(
  asset: Asset,
): `/${LocalAssetFileName<Asset>}` => `/${getLocalAssetFileName(asset)}`

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
        patternIndex: parseInt(patternIndex, 10) as RecordedPatternIndexes,
        accordIndex: parseInt(accordIndex, 10) as RecordedAccordIndexes,
        strength: strength as Strength,
      }),
    )

  ;({ accordIndex, strength } =
    fileName.match(localSlowStrumAssetFileNameRegExp)?.groups || {})

  if (accordIndex && strength)
    return Option.some(
      new TaggedSlowStrumPointer({
        accordIndex: parseInt(accordIndex, 10) as RecordedAccordIndexes,
        strength: strength as Strength,
      }),
    )

  return Option.none()
}
