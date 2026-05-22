import { readFile } from 'node:fs/promises'

import * as Schema from 'effect/Schema'

const artistsSchema = Schema.parseJson(
  Schema.NonEmptyArray(
    Schema.Struct({
      image: Schema.NonEmptyTrimmedString,
      title: Schema.NonEmptyString,
    }).annotations({ title: 'Artist' }),
  ),
).annotations({ title: 'Artists' })

const artists = Schema.decodeUnknownSync(artistsSchema)(
  await readFile('artists.json', 'utf-8'),
)

console.log('artists.length ', artists.length)

const artists_deduped = new Set(artists.map(e => e.title))

console.log('artists_deduped.length ', artists_deduped.size)

const findDupes = <TIn, TOut extends string>(
  arr: readonly TIn[] | TIn[],
  getKey: (i: TIn) => TOut,
) => {
  const map: Record<TOut, TIn[]> = Object.create(null)

  for (const tin of arr) map[getKey(tin)] = [...(map[getKey(tin)] ?? []), tin]

  for (const tout in map)
    if (map[tout]?.length > 1)
      console.log(
        `duplicate times ${map[tout].length} value ${tout} in `,
        map[tout],
      )
}

findDupes(artists, e => e.title)
