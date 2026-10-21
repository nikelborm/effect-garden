import * as Arbitrary from 'effect/Arbitrary'
import type * as Brand from 'effect/Brand'
import * as Context from 'effect/Context'
import * as Data from 'effect/Data'
import * as Layer from 'effect/Layer'
import type * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import type { BrandifyTuple } from '../helpers/BrandifyTuple.ts'
import type { Distribute } from '../helpers/Distribute.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

const chordsRawBase = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'D', 'E'] as const

export type AllChordTuple = BrandifyTuple<Chord, typeof chordsRawBase>
export const allChords = chordsRawBase as AllChordTuple

export const chordSet = new Set(allChords)

export type Chord = Distribute<
  Brand.Branded<(typeof chordsRawBase)[number], 'Chord'>
>

export type ChordOption = Option.Option<Chord>

export const ChordSchema = Schema.Literals(chordsRawBase)
  .annotateKey({ title: 'Chord' })
  .pipe(Schema.brand('Chord'))

export const ChordArbitrary = Arbitrary.schema(ChordSchema)

export const decodeChordSync = Schema.decodeSync(ChordSchema)
export const decodeChordOptionFromUnknown =
  Schema.decodeUnknownOption(ChordSchema)
export const decodeChordSyncFromUnknown = Schema.decodeUnknownSync(ChordSchema)

export class ChordData extends Data.TaggedClass('next-midi-demo/Chord')<{
  chord: Chord
}> {
  constructor(chord: Chord) {
    super({ chord })
  }
  static makeUnsafe = (candidate: string) =>
    new this(decodeChordSyncFromUnknown(candidate))
  static models = (candidate: unknown) => candidate instanceof this
}

export const ChordDataArbitrary = Arbitrary.map(
  ChordArbitrary,
  chord => new ChordData(chord),
)

export class ChordParamButtonData extends ParamButtonIdData<ChordData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof ChordParamButtonData>()(ChordData)

  static makeUnsafe = (candidate: string) =>
    new this(ChordData.makeUnsafe(candidate))
  static make = (chord: Chord) => new this(new ChordData(chord))
}

// Unbranded chord as it appears in asset file names (without padding `_`).
// Used to compose `local*AssetFileNameRegExp` in
// `helpers/audioAssetFileNameAndPath.ts`.
export const chordFileNameRegExpSource = '[A-G][m#b]?'

export const defaultChord = decodeChordSync(chordsRawBase[0])

export type UnbrandedChord<TChord extends Chord> = Brand.Brand.Unbranded<TChord>

export const UnbrandedChord = <TChord extends Chord>(chord: TChord) =>
  chord as UnbrandedChord<TChord>

export class AllChords extends Context.Service<AllChords, AllChordTuple>()(
  'next-midi-demo/app/domain/Chord/AllChords',
) {}

export const AllChordsLayer: Layer.Layer<AllChords> = Layer.succeed(
  AllChords,
  allChords,
)
