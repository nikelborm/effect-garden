import { flow } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Struct from 'effect/Struct'

import {
  type Accord,
  accordFileNameRegExpSource,
  decodeAccordOptionFromUnknown,
  type UnbrandedAccord,
} from '../domain/Accord.ts'
import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../domain/AssetPointer.ts'
import {
  decodePatternOptionFromUnknown,
  type Pattern,
  patternFileNameRegExpSource,
  UnbrandedPattern,
} from '../domain/Pattern.ts'
import {
  decodeStrengthOptionFromUnknown,
  type Strength,
  strengthFileNameRegExpSource,
  UnbrandedStrength,
} from '../domain/Strength.ts'
import type { StringToArray } from './StringToArray.ts'

const getPaddedAccord = <const TAccord extends Accord>(accord: TAccord) =>
  accord.padEnd(2, '_') as PaddedAccord<TAccord>

export type PaddedAccord<TAccordBranded extends Accord> =
  UnbrandedAccord<TAccordBranded> extends infer TAccord extends string
    ? StringToArray<TAccord>['length'] extends infer TAccordLength extends
        number
      ? TAccordLength extends 2
        ? TAccord
        : TAccordLength extends 1
          ? `${TAccord}_`
          : never
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
  `accord_${getPaddedAccord(accord)}_strength_${UnbrandedStrength(strength)}.wav`

export type RemotePatternAssetFileName<
  TAccord extends Accord,
  TStrength extends Strength,
> = `accord_${PaddedAccord<TAccord>}_strength_${UnbrandedStrength<TStrength>}.wav`

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

const getAssetAccord = <const TAsset extends AssetPointer>(asset: TAsset) =>
  asset.accord as AssetAccord<TAsset>

export type AssetAccord<TAsset extends AssetPointer> = TAsset['accord']

///

const getAssetPattern = <const TAsset extends TaggedPatternPointer>(
  asset: TAsset,
) => asset.pattern as AssetPattern<TAsset>

export type AssetPattern<TAsset extends TaggedPatternPointer> =
  TAsset['pattern']

///

const getAssetStrength = <const TAsset extends AssetPointer>(asset: TAsset) =>
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

export const getRemoteAssetPath = <const TAsset extends AssetPointer>(
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

export const getLocalAssetFileName = <const TAsset extends AssetPointer>(
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

export const getLocalAssetFilePath = <const TAsset extends AssetPointer>(
  asset: TAsset,
): LocalAssetFilePath<TAsset> => `/${getLocalAssetFileName(asset)}`

export type LocalAssetFilePath<TAsset extends AssetPointer> =
  `/${LocalAssetFileName<TAsset>}`

///

// _? in regexp moved outside the group to make sure this padding is not included in the group
const localPatternAssetFileNameRegExp = new RegExp(
  `^pattern_(?<pattern>${patternFileNameRegExpSource})_accord_(?<accord>${accordFileNameRegExpSource})_?_strength_(?<strength>${strengthFileNameRegExpSource})\\.wav$`,
)

const localSlowStrumAssetFileNameRegExp = new RegExp(
  `^slow_strum_accord_(?<accord>${accordFileNameRegExpSource})_?_strength_(?<strength>${strengthFileNameRegExpSource})\\.wav$`,
)

export const getAssetFromLocalFileName = (
  fileName: string,
): Option.Option<AssetPointer> => {
  const parseBase = (regexp: RegExp) =>
    Option.flatMap(
      Option.fromNullishOr(fileName.match(regexp)?.groups),
      flow(
        Struct.evolve({
          pattern: decodePatternOptionFromUnknown,
          accord: decodeAccordOptionFromUnknown,
          strength: decodeStrengthOptionFromUnknown,
        }),
        Option.all as () => Option.Option<any>,
      ),
    )

  return parseBase(localPatternAssetFileNameRegExp).pipe(
    Option.flatMap(TaggedPatternPointer.makeOption),
    Option.orElse(() =>
      Option.flatMap(
        parseBase(localSlowStrumAssetFileNameRegExp),
        TaggedSlowStrumPointer.makeOption,
      ),
    ),
  )
}
