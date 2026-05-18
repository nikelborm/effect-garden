import { readFile, writeFile } from 'node:fs/promises'

import * as EArray from 'effect/Array'
import { pipe } from 'effect/Function'
import * as HashSet from 'effect/HashSet'
import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'

import { HtmlTracksSchema } from './HtmlTracksSchema.ts'

const shitImage =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const deduped = pipe(
  await Promise.all(
    [
      './rawData/tracksFromHtml1.json',
      './rawData/tracksFromHtml2.json',
      './rawData/tracksFromHtml3.json',
      './rawData/tracksFromHtml4.json',
      './rawData/tracksFromHtml5.json',
      './rawData/tracksFromHtml6.json',
      './rawData/tracksFromHtml7.json',
    ].map(path => readFile(path, 'utf-8').then(e => JSON.parse(e) as any[])),
  ),
  EArray.flatten,
  EArray.filter(
    e => e.title !== null && e.videoId !== null && e.duration !== null,
  ),
  EArray.map(({ liked, coverUrl, ...rest }) => ({
    coverUrl: coverUrl.replace('https://lh3.', 'https://yt3.'),
    ...rest,
  })),
  Schema.decodeUnknownSync(HtmlTracksSchema),
  HashSet.fromIterable,
  HashSet.toValues,
  EArray.groupBy(e => e.videoId),
  Record.map(e => e.filter(a => a.coverUrl !== shitImage)[0] ?? e[0]),
  Record.map(e => ({
    ...e,
    coverUrl: e.coverUrl === shitImage ? null : e.coverUrl,
  })),
  Record.values,
)

console.log('deduped size: ', deduped.length)

await writeFile(
  './rawData/tracksFromHtmlDeduped.json',
  JSON.stringify(deduped, null, 2) + '\n',
)
