import { readFile } from 'node:fs/promises'

import * as Schema from 'effect/Schema'

const artists2Schema = Schema.parseJson(
  Schema.NonEmptyArray(
    Schema.Struct({
      image: Schema.NonEmptyTrimmedString,
      title: Schema.NonEmptyString,
    }).annotations({ title: 'Artist' }),
  ),
).annotations({ title: 'Artists_2' })

const artists2 = Schema.decodeUnknownSync(artists2Schema)(
  await readFile('artists2.json', 'utf-8'),
)

console.log('artists2.length ', artists2.length)

const artists2_deduped = new Set(artists2.map(e => e.title))

console.log('artists2_deduped.length ', artists2_deduped.size)

const findDupes = <TIn, TOut extends string>(
  arr: readonly TIn[] | TIn[],
  getKey: (i: TIn) => TOut,
) => {
  const map: Record<TOut, TIn[]> = Object.create(null)

  for (const tin of arr) map[getKey(tin)] = [...(map[getKey(tin)] ?? []), tin]

  for (const tout in map)
    if (map[tout]!.length > 1)
      console.log(
        `duplicate times ${map[tout].length} value ${tout} in `,
        map[tout],
      )
}

findDupes(artists2, e => e.title)
