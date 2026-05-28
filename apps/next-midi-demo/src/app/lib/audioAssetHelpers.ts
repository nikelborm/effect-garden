import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

export type AssetPointer = TaggedPatternPointer | TaggedSlowStrumPointer

export const AccordIndexSchema = Schema.Literal(0, 1, 2, 3, 4, 5, 6, 7)
export const PatternIndexSchema = Schema.Literal(0, 1, 2, 3, 4, 5, 6, 7)
export const StrengthSchema = Schema.Literal('s', 'm', 'v')
export type StrengthUnion = (typeof StrengthSchema)['Type']

export const decodeAccordIndexSync = Schema.decodeSync(AccordIndexSchema)
export const decodePatternIndexSync = Schema.decodeSync(PatternIndexSchema)

export class TaggedPatternPointer extends Schema.TaggedClass<TaggedPatternPointer>()(
  'TaggedPatternPointer',
  {
    patternIndex: PatternIndexSchema,
    accordIndex: AccordIndexSchema,
    strength: StrengthSchema,
  },
) {
  static models = Schema.is(TaggedPatternPointer) as (
    p: unknown,
  ) => p is TaggedPatternPointer
}

export type PatternPointer = Omit<TaggedPatternPointer, '_tag'>

export class TaggedSlowStrumPointer extends Schema.TaggedClass<TaggedSlowStrumPointer>()(
  'TaggedSlowStrumPointer',
  {
    patternIndex: Schema.Never.pipe(Schema.optionalWith({ exact: true })),
    accordIndex: PatternIndexSchema,
    strength: StrengthSchema,
  },
) {
  static models = Schema.is(TaggedSlowStrumPointer) as (
    p: unknown,
  ) => p is TaggedSlowStrumPointer
}

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

export type AccordIndexUnion = TupleIndices<RecordedAccordsTuple>

export type RecordAccordNames = RecordedAccordsTuple[AccordIndexUnion]

export type PatternIndexUnion = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type StringToArray<T extends string> =
  T extends `${infer Character}${infer Rest}`
    ? [Character, ...StringToArray<Rest>]
    : []

export type GetPaddedAccordName<SelectedAccordIndex extends AccordIndexUnion> =
  RecordedAccordsTuple[SelectedAccordIndex] extends infer A extends string
    ? StringToArray<A>['length'] extends infer L extends number
      ? L extends 2
        ? A
        : L extends 1
          ? `${A}_`
          : never
      : never
    : never

const getRemotePatternAssetFileName = <
  const SelectedAccordIndex extends AccordIndexUnion,
  const SelectedStrength extends StrengthUnion,
>(
  accordIndex: SelectedAccordIndex,
  strength: SelectedStrength,
) =>
  `accord_${accordIndex}_${RECORDED_ACCORDS[accordIndex].padEnd(2, '_') as GetPaddedAccordName<SelectedAccordIndex>}_strength_${strength}.wav` as const

const getRemotePatternAssetFolderName = <
  const SelectedPatternIndex extends PatternIndexUnion,
>(
  patternIndex: SelectedPatternIndex,
) => `pattern_${patternIndex}` as const

const getRemotePatternAssetPath = <
  const SelectedAccordIndex extends AccordIndexUnion,
  const SelectedPatternIndex extends PatternIndexUnion,
  const SelectedStrength extends StrengthUnion,
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
  const SelectedAccordIndex extends AccordIndexUnion,
  const SelectedStrength extends StrengthUnion,
>(
  accordIndex: SelectedAccordIndex,
  strength: SelectedStrength,
): RemoteSlowStrumAssetFileName<SelectedAccordIndex, SelectedStrength> =>
  `/samples/slow_strum/${getRemotePatternAssetFileName(accordIndex, strength)}` as const

export type RemotePatternAssetFileName<
  SelectedAccordIndex extends AccordIndexUnion,
  SelectedPatternIndex extends PatternIndexUnion,
  SelectedStrength extends StrengthUnion,
> = `/samples/pattern_${SelectedPatternIndex}/accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

export type RemoteSlowStrumAssetFileName<
  SelectedAccordIndex extends AccordIndexUnion,
  SelectedStrength extends StrengthUnion,
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
  TaggedPatternPointer.models(asset)
    ? (getRemotePatternAssetPath(asset) as any)
    : (getRemoteSlowStrumAssetPath(asset.accordIndex, asset.strength) as any)

export type LocalPatternAssetFileName<
  SelectedAccordIndex extends AccordIndexUnion,
  SelectedPatternIndex extends PatternIndexUnion,
  SelectedStrength extends StrengthUnion,
> = `pattern_${SelectedPatternIndex}_accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

export type LocalSlowStrumAssetFileName<
  SelectedAccordIndex extends AccordIndexUnion,
  SelectedStrength extends StrengthUnion,
> = `slow_strum_accord_${SelectedAccordIndex}_${GetPaddedAccordName<SelectedAccordIndex>}_strength_${SelectedStrength}.wav`

const getLocalPatternAssetFileName = <
  const SelectedAccordIndex extends AccordIndexUnion,
  const SelectedPatternIndex extends PatternIndexUnion,
  const SelectedStrength extends StrengthUnion,
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
  const SelectedAccordIndex extends AccordIndexUnion,
  const SelectedStrength extends StrengthUnion,
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
  TaggedPatternPointer.models(asset)
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
        patternIndex: parseInt(patternIndex, 10) as PatternIndexUnion,
        accordIndex: parseInt(accordIndex, 10) as AccordIndexUnion,
        strength: strength as StrengthUnion,
      }),
    )

  ;({ accordIndex, strength } =
    fileName.match(localSlowStrumAssetFileNameRegExp)?.groups || {})

  if (accordIndex && strength)
    return Option.some(
      new TaggedSlowStrumPointer({
        accordIndex: parseInt(accordIndex, 10) as AccordIndexUnion,
        strength: strength as StrengthUnion,
      }),
    )

  return Option.none()
}
