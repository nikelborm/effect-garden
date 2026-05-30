/** biome-ignore-all lint/complexity/useLiteralKeys: incompatibility with TS */

import { pipe } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Record from 'effect/Record'

import {
  type AccordByIndex,
  AccordIndex,
  mapIndexToAccord,
  UnbrandedAccordIndex,
} from '../brandsAndDatas/Accord.ts'
import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../brandsAndDatas/AssetPointer.ts'
import {
  PatternIndex,
  UnbrandedPatternIndex,
} from '../brandsAndDatas/Pattern.ts'
import { Strength, UnbrandedStrength } from '../brandsAndDatas/Strength.ts'
import { parseInt10 } from './parseInt10.ts'
import type { StringToArray } from './StringToArray.ts'

const getPaddedAccordLabel = <const TAccordIndex extends AccordIndex>(
  accordIndex: TAccordIndex,
) =>
  mapIndexToAccord(accordIndex).label.padEnd(
    2,
    '_',
  ) as PaddedAccordLabel<TAccordIndex>

export type PaddedAccordLabel<TAccordIndex extends AccordIndex> =
  AccordByIndex<TAccordIndex>['label'] extends infer Label extends string
    ? StringToArray<Label>['length'] extends infer LabelLength extends number
      ? LabelLength extends 2
        ? Label
        : LabelLength extends 1
          ? `${Label}_`
          : never
      : never
    : never

///

const getRemotePatternAssetFileName = <
  const TAccordIndex extends AccordIndex,
  const TStrength extends Strength,
>(
  accordIndex: TAccordIndex,
  strength: TStrength,
): RemotePatternAssetFileName<TAccordIndex, TStrength> =>
  `accord_${UnbrandedAccordIndex(accordIndex)}_${getPaddedAccordLabel(accordIndex)}_strength_${UnbrandedStrength(strength)}.wav`

export type RemotePatternAssetFileName<
  TAccordIndex extends AccordIndex,
  TStrength extends Strength,
> = `accord_${UnbrandedAccordIndex<TAccordIndex>}_${PaddedAccordLabel<TAccordIndex>}_strength_${UnbrandedStrength<TStrength>}.wav`

///

const getRemotePatternAssetFolderName = <
  const TPatternIndex extends PatternIndex,
>(
  patternIndex: TPatternIndex,
): RemotePatternAssetFolderName<TPatternIndex> =>
  `pattern_${UnbrandedPatternIndex(patternIndex)}`

export type RemotePatternAssetFolderName<TPatternIndex extends PatternIndex> =
  `pattern_${UnbrandedPatternIndex<TPatternIndex>}`

///

const getRemotePatternAssetPath = <
  const TAccordIndex extends AccordIndex,
  const TPatternIndex extends PatternIndex,
  const TStrength extends Strength,
>(
  accordIndex: TAccordIndex,
  patternIndex: TPatternIndex,
  strength: TStrength,
): RemotePatternAssetPath<TAccordIndex, TPatternIndex, TStrength> =>
  `/samples/${getRemotePatternAssetFolderName(patternIndex)}/${getRemotePatternAssetFileName(accordIndex, strength)}` as const

export type RemotePatternAssetPath<
  TAccordIndex extends AccordIndex,
  TPatternIndex extends PatternIndex,
  TStrength extends Strength,
> = `/samples/${RemotePatternAssetFolderName<TPatternIndex>}/${RemotePatternAssetFileName<
  TAccordIndex,
  TStrength
>}`

///

const getRemoteSlowStrumAssetPath = <
  const TAccordIndex extends AccordIndex,
  const TStrength extends Strength,
>(
  accordIndex: TAccordIndex,
  strength: TStrength,
): RemoteSlowStrumAssetPath<TAccordIndex, TStrength> =>
  `/samples/slow_strum/${getRemotePatternAssetFileName(accordIndex, strength)}`

export type RemoteSlowStrumAssetPath<
  TAccordIndex extends AccordIndex,
  TStrength extends Strength,
> = `/samples/slow_strum/${RemotePatternAssetFileName<TAccordIndex, TStrength>}`

///

const getAssetAccordIndex = <TAsset extends AssetPointer>(asset: TAsset) =>
  asset.accordIndex as AssetAccordIndex<TAsset>

export type AssetAccordIndex<TAsset extends AssetPointer> =
  TAsset['accordIndex']

///

const getAssetPatternIndex = <TAsset extends TaggedPatternPointer>(
  asset: TAsset,
) => asset.patternIndex as AssetPatternIndex<TAsset>

export type AssetPatternIndex<TAsset extends TaggedPatternPointer> =
  TAsset['patternIndex']

///

const getAssetStrength = <TAsset extends AssetPointer>(asset: TAsset) =>
  asset.strength as AssetStrength<TAsset>

export type AssetStrength<TAsset extends AssetPointer> = TAsset['strength']

///

const getLocalPatternAssetFileName = <
  const TAccordIndex extends AccordIndex,
  const TPatternIndex extends PatternIndex,
  const TStrength extends Strength,
>(
  accordIndex: TAccordIndex,
  patternIndex: TPatternIndex,
  strength: TStrength,
): LocalPatternAssetFileName<TAccordIndex, TPatternIndex, TStrength> =>
  `${getRemotePatternAssetFolderName(patternIndex)}_${getRemotePatternAssetFileName(accordIndex, strength)}`

export type LocalPatternAssetFileName<
  TAccordIndex extends AccordIndex,
  TPatternIndex extends PatternIndex,
  TStrength extends Strength,
> = `${RemotePatternAssetFolderName<TPatternIndex>}_${RemotePatternAssetFileName<TAccordIndex, TStrength>}`

///

const getLocalSlowStrumAssetFileName = <
  const TAccordIndex extends AccordIndex,
  const TStrength extends Strength,
>(
  accordIndex: TAccordIndex,
  strength: TStrength,
): LocalSlowStrumAssetFileName<TAccordIndex, TStrength> =>
  `slow_strum_${getRemotePatternAssetFileName(accordIndex, strength)}`

export type LocalSlowStrumAssetFileName<
  TAccordIndex extends AccordIndex,
  TStrength extends Strength,
> = `slow_strum_${RemotePatternAssetFileName<TAccordIndex, TStrength>}`

///

export const getRemoteAssetPath = <TAsset extends AssetPointer>(
  asset: TAsset,
): RemoteAssetPath<TAsset> =>
  TaggedPatternPointer.models(asset)
    ? getRemotePatternAssetPath(
        getAssetAccordIndex(asset),
        getAssetPatternIndex(asset),
        getAssetStrength(asset),
      )
    : getRemoteSlowStrumAssetPath(
        getAssetAccordIndex(asset),
        getAssetStrength(asset),
      )

export type RemoteAssetPath<TAsset extends AssetPointer> =
  TAsset extends TaggedPatternPointer
    ? RemotePatternAssetPath<
        AssetAccordIndex<TAsset>,
        AssetPatternIndex<TAsset>,
        AssetStrength<TAsset>
      >
    : TAsset extends TaggedSlowStrumPointer
      ? RemoteSlowStrumAssetPath<
          AssetAccordIndex<TAsset>,
          AssetStrength<TAsset>
        >
      : never
///

export const getLocalAssetFileName = <TAsset extends AssetPointer>(
  asset: TAsset,
): LocalAssetFileName<TAsset> =>
  TaggedPatternPointer.models(asset)
    ? getLocalPatternAssetFileName(
        getAssetAccordIndex(asset),
        getAssetPatternIndex(asset),
        getAssetStrength(asset),
      )
    : getLocalSlowStrumAssetFileName(
        getAssetAccordIndex(asset),
        getAssetStrength(asset),
      )

export type LocalAssetFileName<TAsset extends AssetPointer> =
  TAsset extends TaggedPatternPointer
    ? LocalPatternAssetFileName<
        AssetAccordIndex<TAsset>,
        AssetPatternIndex<TAsset>,
        AssetStrength<TAsset>
      >
    : TAsset extends TaggedSlowStrumPointer
      ? LocalSlowStrumAssetFileName<
          AssetAccordIndex<TAsset>,
          AssetStrength<TAsset>
        >
      : never

///

export const getLocalAssetFilePath = <TAsset extends AssetPointer>(
  asset: TAsset,
): LocalAssetFilePath<TAsset> => `/${getLocalAssetFileName(asset)}`

export type LocalAssetFilePath<TAsset extends AssetPointer> =
  `/${LocalAssetFileName<TAsset>}`

///

const localPatternAssetFileNameRegExp =
  /^pattern_(?<patternIndex>\d)_accord_(?<accordIndex>\d)_(?:[A-G][m#b]?_?)_strength_(?<strength>[smv])\.wav$/

const localSlowStrumAssetFileNameRegExp =
  /^slow_strum_accord_(?<accordIndex>\d)_(?:[A-G][m#b]?_?)_strength_(?<strength>[smv])\.wav$/

export const getAssetFromLocalFileName = (
  fileName: string,
): Option.Option<AssetPointer> => {
  const parseBase = (regexp: RegExp) =>
    Option.flatMap(
      Option.fromNullable(fileName.match(regexp)?.groups),
      groups =>
        Option.all({
          ...Record.map(groups, Option.some),
          accordIndex: AccordIndex.option(parseInt10(groups['accordIndex'])),
          strength: Strength.option(groups['strength']),
        }),
    ) as Option.Option<{ accordIndex: AccordIndex; strength: Strength }>

  return parseBase(localPatternAssetFileNameRegExp).pipe(
    Option.orElse(() => parseBase(localSlowStrumAssetFileNameRegExp)),
    Option.flatMap(base =>
      pipe(
        (base as { patternIndex?: string }).patternIndex,
        parseInt10,
        PatternIndex.option,
        Option.map(patternIndex => ({ ...base, patternIndex })),
        Option.map(extended => new TaggedPatternPointer(extended)),
        Option.orElseSome(() => new TaggedSlowStrumPointer(base)),
      ),
    ),
  )
}
