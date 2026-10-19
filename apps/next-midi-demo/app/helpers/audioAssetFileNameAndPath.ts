import { flow } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Struct from 'effect/Struct'

import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../domain/AssetPointer.ts'
import {
  type Chord,
  chordFileNameRegExpSource,
  decodeChordOptionFromUnknown,
  type UnbrandedChord,
} from '../domain/Chord.ts'
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

const getPaddedChord = <const TChord extends Chord>(chord: TChord) =>
  chord.padEnd(2, '_') as PaddedChord<TChord>

export type PaddedChord<TChordBranded extends Chord> =
  UnbrandedChord<TChordBranded> extends infer TChord extends string
    ? StringToArray<TChord>['length'] extends infer TChordLength extends number
      ? TChordLength extends 2
        ? TChord
        : TChordLength extends 1
          ? `${TChord}_`
          : never
      : never
    : never

///

const getRemotePatternAssetFileName = <
  const TChord extends Chord,
  const TStrength extends Strength,
>(
  chord: TChord,
  strength: TStrength,
): RemotePatternAssetFileName<TChord, TStrength> =>
  `chord_${getPaddedChord(chord)}_strength_${UnbrandedStrength(strength)}.wav`

export type RemotePatternAssetFileName<
  TChord extends Chord,
  TStrength extends Strength,
> = `chord_${PaddedChord<TChord>}_strength_${UnbrandedStrength<TStrength>}.wav`

///

const getRemotePatternAssetFolderName = <const TPattern extends Pattern>(
  pattern: TPattern,
): RemotePatternAssetFolderName<TPattern> =>
  `pattern_${UnbrandedPattern(pattern)}`

export type RemotePatternAssetFolderName<TPattern extends Pattern> =
  `pattern_${UnbrandedPattern<TPattern>}`

///

const getRemotePatternAssetPath = <
  const TChord extends Chord,
  const TPattern extends Pattern,
  const TStrength extends Strength,
>(
  chord: TChord,
  pattern: TPattern,
  strength: TStrength,
): RemotePatternAssetPath<TChord, TPattern, TStrength> =>
  `/samples/${getRemotePatternAssetFolderName(pattern)}/${getRemotePatternAssetFileName(chord, strength)}` as const

export type RemotePatternAssetPath<
  TChord extends Chord,
  TPattern extends Pattern,
  TStrength extends Strength,
> = `/samples/${RemotePatternAssetFolderName<TPattern>}/${RemotePatternAssetFileName<
  TChord,
  TStrength
>}`

///

const getRemoteSlowStrumAssetPath = <
  const TChord extends Chord,
  const TStrength extends Strength,
>(
  chord: TChord,
  strength: TStrength,
): RemoteSlowStrumAssetPath<TChord, TStrength> =>
  `/samples/slow_strum/${getRemotePatternAssetFileName(chord, strength)}`

export type RemoteSlowStrumAssetPath<
  TChord extends Chord,
  TStrength extends Strength,
> = `/samples/slow_strum/${RemotePatternAssetFileName<TChord, TStrength>}`

///

const getAssetChord = <const TAsset extends AssetPointer>(asset: TAsset) =>
  asset.chord as AssetChord<TAsset>

export type AssetChord<TAsset extends AssetPointer> = TAsset['chord']

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
  const TChord extends Chord,
  const TPattern extends Pattern,
  const TStrength extends Strength,
>(
  chord: TChord,
  pattern: TPattern,
  strength: TStrength,
): LocalPatternAssetFileName<TChord, TPattern, TStrength> =>
  `${getRemotePatternAssetFolderName(pattern)}_${getRemotePatternAssetFileName(chord, strength)}`

export type LocalPatternAssetFileName<
  TChord extends Chord,
  TPattern extends Pattern,
  TStrength extends Strength,
> = `${RemotePatternAssetFolderName<TPattern>}_${RemotePatternAssetFileName<TChord, TStrength>}`

///

const getLocalSlowStrumAssetFileName = <
  const TChord extends Chord,
  const TStrength extends Strength,
>(
  chord: TChord,
  strength: TStrength,
): LocalSlowStrumAssetFileName<TChord, TStrength> =>
  `slow_strum_${getRemotePatternAssetFileName(chord, strength)}`

export type LocalSlowStrumAssetFileName<
  TChord extends Chord,
  TStrength extends Strength,
> = `slow_strum_${RemotePatternAssetFileName<TChord, TStrength>}`

///

export const getRemoteAssetPath = <const TAsset extends AssetPointer>(
  asset: TAsset,
): RemoteAssetPath<TAsset> =>
  TaggedPatternPointer.models(asset)
    ? getRemotePatternAssetPath(
        getAssetChord(asset),
        getAssetPattern(asset),
        getAssetStrength(asset),
      )
    : getRemoteSlowStrumAssetPath(getAssetChord(asset), getAssetStrength(asset))

export type RemoteAssetPath<TAsset extends AssetPointer> =
  TAsset extends TaggedPatternPointer
    ? RemotePatternAssetPath<
        AssetChord<TAsset>,
        AssetPattern<TAsset>,
        AssetStrength<TAsset>
      >
    : TAsset extends TaggedSlowStrumPointer
      ? RemoteSlowStrumAssetPath<AssetChord<TAsset>, AssetStrength<TAsset>>
      : never

///

export const getLocalAssetFileName = <const TAsset extends AssetPointer>(
  asset: TAsset,
): LocalAssetFileName<TAsset> =>
  TaggedPatternPointer.models(asset)
    ? getLocalPatternAssetFileName(
        getAssetChord(asset),
        getAssetPattern(asset),
        getAssetStrength(asset),
      )
    : getLocalSlowStrumAssetFileName(
        getAssetChord(asset),
        getAssetStrength(asset),
      )

export type LocalAssetFileName<TAsset extends AssetPointer> =
  TAsset extends TaggedPatternPointer
    ? LocalPatternAssetFileName<
        AssetChord<TAsset>,
        AssetPattern<TAsset>,
        AssetStrength<TAsset>
      >
    : TAsset extends TaggedSlowStrumPointer
      ? LocalSlowStrumAssetFileName<AssetChord<TAsset>, AssetStrength<TAsset>>
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
  `^pattern_(?<pattern>${patternFileNameRegExpSource})_chord_(?<chord>${chordFileNameRegExpSource})_?_strength_(?<strength>${strengthFileNameRegExpSource})\\.wav$`,
)

const localSlowStrumAssetFileNameRegExp = new RegExp(
  `^slow_strum_chord_(?<chord>${chordFileNameRegExpSource})_?_strength_(?<strength>${strengthFileNameRegExpSource})\\.wav$`,
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
          chord: decodeChordOptionFromUnknown,
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
