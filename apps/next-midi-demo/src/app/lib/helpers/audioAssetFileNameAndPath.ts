/** biome-ignore-all lint/complexity/useLiteralKeys: incompatibility with TS */

import { flow, pipe } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Struct from 'effect/Struct'

import { Accord, UnbrandedAccord } from '../brandsAndDatas/Accord.ts'
import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../brandsAndDatas/AssetPointer.ts'
import { Pattern, UnbrandedPattern } from '../brandsAndDatas/Pattern.ts'
import { Strength, UnbrandedStrength } from '../brandsAndDatas/Strength.ts'
import { parseInt10 } from './parseInt10.ts'
import type { StringToArray } from './StringToArray.ts'

const getPaddedAccord = <const TAccord extends Accord>(accord: TAccord) =>
  accord.padEnd(2, '_') as PaddedAccord<TAccord>

export type PaddedAccord<TAccord extends Accord> =
  StringToArray<TAccord>['length'] extends infer TAccordLength extends number
    ? TAccordLength extends 2
      ? TAccord
      : TAccordLength extends 1
        ? `${TAccord}_`
        : never
    : never

///

const getRemotePatternAssetFileName = <
  const TAccord extends Accord,
  const TStrength extends Strength,
>(
  accord: TAccord,
  strength: TStrength,
): RemotePatternAssetFileName<TAccord, TStrength> =>
  `accord_${UnbrandedAccord(accord)}_${getPaddedAccord(accord)}_strength_${UnbrandedStrength(strength)}.wav`

export type RemotePatternAssetFileName<
  TAccord extends Accord,
  TStrength extends Strength,
> = `accord_${UnbrandedAccord<TAccord>}_${PaddedAccord<TAccord>}_strength_${UnbrandedStrength<TStrength>}.wav`

///

const getRemotePatternAssetFolderName = <const TPattern extends Pattern>(
  pattern: TPattern,
): RemotePatternAssetFolderName<TPattern> =>
  `pattern_${UnbrandedPattern(pattern)}`

export type RemotePatternAssetFolderName<TPattern extends Pattern> =
  `pattern_${UnbrandedPattern<TPattern>}`

///

const getRemotePatternAssetPath = <
  const TAccord extends Accord,
  const TPattern extends Pattern,
  const TStrength extends Strength,
>(
  accord: TAccord,
  pattern: TPattern,
  strength: TStrength,
): RemotePatternAssetPath<TAccord, TPattern, TStrength> =>
  `/samples/${getRemotePatternAssetFolderName(pattern)}/${getRemotePatternAssetFileName(accord, strength)}` as const

export type RemotePatternAssetPath<
  TAccord extends Accord,
  TPattern extends Pattern,
  TStrength extends Strength,
> = `/samples/${RemotePatternAssetFolderName<TPattern>}/${RemotePatternAssetFileName<
  TAccord,
  TStrength
>}`

///

const getRemoteSlowStrumAssetPath = <
  const TAccord extends Accord,
  const TStrength extends Strength,
>(
  accord: TAccord,
  strength: TStrength,
): RemoteSlowStrumAssetPath<TAccord, TStrength> =>
  `/samples/slow_strum/${getRemotePatternAssetFileName(accord, strength)}`

export type RemoteSlowStrumAssetPath<
  TAccord extends Accord,
  TStrength extends Strength,
> = `/samples/slow_strum/${RemotePatternAssetFileName<TAccord, TStrength>}`

///

const getAssetAccord = <TAsset extends AssetPointer>(asset: TAsset) =>
  asset.accord as AssetAccord<TAsset>

export type AssetAccord<TAsset extends AssetPointer> = TAsset['accord']

///

const getAssetPattern = <TAsset extends TaggedPatternPointer>(asset: TAsset) =>
  asset.pattern as AssetPattern<TAsset>

export type AssetPattern<TAsset extends TaggedPatternPointer> =
  TAsset['pattern']

///

const getAssetStrength = <TAsset extends AssetPointer>(asset: TAsset) =>
  asset.strength as AssetStrength<TAsset>

export type AssetStrength<TAsset extends AssetPointer> = TAsset['strength']

///

const getLocalPatternAssetFileName = <
  const TAccord extends Accord,
  const TPattern extends Pattern,
  const TStrength extends Strength,
>(
  accord: TAccord,
  pattern: TPattern,
  strength: TStrength,
): LocalPatternAssetFileName<TAccord, TPattern, TStrength> =>
  `${getRemotePatternAssetFolderName(pattern)}_${getRemotePatternAssetFileName(accord, strength)}`

export type LocalPatternAssetFileName<
  TAccord extends Accord,
  TPattern extends Pattern,
  TStrength extends Strength,
> = `${RemotePatternAssetFolderName<TPattern>}_${RemotePatternAssetFileName<TAccord, TStrength>}`

///

const getLocalSlowStrumAssetFileName = <
  const TAccord extends Accord,
  const TStrength extends Strength,
>(
  accord: TAccord,
  strength: TStrength,
): LocalSlowStrumAssetFileName<TAccord, TStrength> =>
  `slow_strum_${getRemotePatternAssetFileName(accord, strength)}`

export type LocalSlowStrumAssetFileName<
  TAccord extends Accord,
  TStrength extends Strength,
> = `slow_strum_${RemotePatternAssetFileName<TAccord, TStrength>}`

///

export const getRemoteAssetPath = <TAsset extends AssetPointer>(
  asset: TAsset,
): RemoteAssetPath<TAsset> =>
  TaggedPatternPointer.models(asset)
    ? getRemotePatternAssetPath(
        getAssetAccord(asset),
        getAssetPattern(asset),
        getAssetStrength(asset),
      )
    : getRemoteSlowStrumAssetPath(
        getAssetAccord(asset),
        getAssetStrength(asset),
      )

export type RemoteAssetPath<TAsset extends AssetPointer> =
  TAsset extends TaggedPatternPointer
    ? RemotePatternAssetPath<
        AssetAccord<TAsset>,
        AssetPattern<TAsset>,
        AssetStrength<TAsset>
      >
    : TAsset extends TaggedSlowStrumPointer
      ? RemoteSlowStrumAssetPath<AssetAccord<TAsset>, AssetStrength<TAsset>>
      : never
///

export const getLocalAssetFileName = <TAsset extends AssetPointer>(
  asset: TAsset,
): LocalAssetFileName<TAsset> =>
  TaggedPatternPointer.models(asset)
    ? getLocalPatternAssetFileName(
        getAssetAccord(asset),
        getAssetPattern(asset),
        getAssetStrength(asset),
      )
    : getLocalSlowStrumAssetFileName(
        getAssetAccord(asset),
        getAssetStrength(asset),
      )

export type LocalAssetFileName<TAsset extends AssetPointer> =
  TAsset extends TaggedPatternPointer
    ? LocalPatternAssetFileName<
        AssetAccord<TAsset>,
        AssetPattern<TAsset>,
        AssetStrength<TAsset>
      >
    : TAsset extends TaggedSlowStrumPointer
      ? LocalSlowStrumAssetFileName<AssetAccord<TAsset>, AssetStrength<TAsset>>
      : never

///

export const getLocalAssetFilePath = <TAsset extends AssetPointer>(
  asset: TAsset,
): LocalAssetFilePath<TAsset> => `/${getLocalAssetFileName(asset)}`

export type LocalAssetFilePath<TAsset extends AssetPointer> =
  `/${LocalAssetFileName<TAsset>}`

///

const localPatternAssetFileNameRegExp =
  /^pattern_(?<pattern>\d)_accord_(?<accord>\d)_(?:[A-G][m#b]?_?)_strength_(?<strength>[smv])\.wav$/

const localSlowStrumAssetFileNameRegExp =
  /^slow_strum_accord_(?<accord>\d)_(?:[A-G][m#b]?_?)_strength_(?<strength>[smv])\.wav$/

export const getAssetFromLocalFileName = (
  fileName: string,
): Option.Option<AssetPointer> => {
  const parseBase = (regexp: RegExp) =>
    Option.map(
      Option.fromNullable(fileName.match(regexp)?.groups),
      Struct.evolve({
        pattern: Option.some,
        accord: flow(parseInt10, Accord.option),
        strength: Strength.option,
      }),
    ).pipe(Option.flatMap(Option.all as any)) as Option.Option<{
      accord: Accord
      strength: Strength
    }>

  return parseBase(localPatternAssetFileNameRegExp).pipe(
    Option.orElse(() => parseBase(localSlowStrumAssetFileNameRegExp)),
    Option.flatMap(base =>
      pipe(
        (base as { pattern?: string }).pattern,
        parseInt10,
        Pattern.option,
        Option.map(pattern => ({ ...base, pattern })),
        Option.map(extended => new TaggedPatternPointer(extended)),
        Option.orElseSome(() => new TaggedSlowStrumPointer(base)),
      ),
    ),
  )
}
