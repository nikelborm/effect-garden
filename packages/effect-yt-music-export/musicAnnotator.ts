import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { google } from 'googleapis'
import { File } from 'node-taglib-sharp'

import { Array as EArray, flow, pipe, Schema, Struct } from 'effect'

const musicVideoRegexp =
  /[([{]((!|[\drpm\- %]+ speed|[+-]|[≅\d%]+ slower|\/|\+|\||\d+|&|4k|acoustic|[fulabm]|doomer|wave|ai|album|electro|slow|breakcore|\d+hz?|netflix|alternative|ambient|and|audio|best|clip|compilation|cover|cyberpunk|deluxe|live|concert|film|digital|doomer|double|down|preview|download|harp|epic|world|record|downtempo|edit|Bass|tik|tok|meme|a late night special|Boosted|n|hours|drum|vertical|playthrough|s|ii|edition|debut|english|epilepsy|extended|for|free|from|full|garage|guitar|hd|homework|stripped|jdm|drift|hop|hour|house|hq|instrumental|live|on|at|home|kexp|lofi|loop|lower|lyric|lyrics|𝐿𝑦𝑟𝑖𝑐𝑠|magic|minute|minutes|rain|mix|mixed|mood|muffled|music|new|now|official|arr\.|officiel|original|tik|tok|challenge|out|perfection|performance|phonk|piano|pitch|playthrough|pop|premiere|profit|quarantine|radio|reimagined|release|remaster|remastered|remix|lyrics|and|translation|in|description|retrowave|reverb|𝙧𝙚𝙫𝙚𝙧𝙗|𝘳𝘦𝘷𝘦𝘳𝘣|𝑟𝑒𝑣𝑒𝑟𝑏|reverbed|rip|rock|rus|russian|s l o w e d \+ r e v e r b|s2|session|set|single|sleep|slowed|𝙨𝙡𝙤𝙬𝙚𝙙|𝘴𝘭𝘰𝘸𝘦𝘥|𝑆𝑙𝑜𝑤𝑒𝑑|slowed & reverb---arnold edit|sovietwave|special|sped|speed|stoic|studio|study|subtitles|super|synthwave|tatar|tiktok|𝙏𝙞𝙠𝙏𝙤𝙠 𝙫𝙚𝙧\.|to|track|trending|trip|trippy|ultra|unofficial|unreleased|up|v2|version|vevo|video|vinyl|visual|visuali[sz]er|warning|анимация|клипа|на|премьера|премьера клипа, 2021|рок|русском| ){1,})[\]})]/gi

const doubleSpaceRegex = / {2,}/g

const tracksBase = (await readdir('/big_media/yt-music/'))
  .map(filename => ({
    filename,
    ...(filename.match(
      /(?<audioTitle>.*) \[(?<youtubeId>[a-zA-Z-_\d]*)\]\.(?<extension>[\da-z]*)$/,
    )?.groups || {}),
  }))
  .filter(
    (
      v,
    ): v is {
      filename: string
      audioTitle: string
      youtubeId: string
      extension: string
    } => !!v,
  )
  .sort((a, b) => a.youtubeId.localeCompare(b.youtubeId))

// const youtube = google.youtube({
//   version: 'v3',
//   auth: 'put required auth here',
// })
// const content = await pipe(
//   tracksBase,
//   EArray.map(v => v.youtubeId),
//   EArray.chunksOf(50),
//   EArray.map((chunk) => youtube.videos.list({
//     id: chunk,
//     part: ['snippet', 'contentDetails', 'topicDetails'],
//   })),
//   response => Promise.all(response),
// ).then(flow(
//   EArray.flatMap(r => r.data.items ?? []),
//   EArray.map(i => [
//     i.id!,
//     {
//       snippet: i.snippet!,
//       contentDetails: i.contentDetails!,
//       topicDetails: i.topicDetails!,
//     }
//   ] as const),
// ))
// await writeFile('./content.json', JSON.stringify(content, null, 2))

const content = JSON.parse(await readFile('./content.json', 'utf-8'))

const contentSchema = Schema.Array(
  Schema.Tuple(
    Schema.String,
    Schema.Struct({
      snippet: Schema.Struct({
        title: Schema.String,
        description: Schema.String,
        channelId: Schema.String,
        channelTitle: Schema.String,
        tags: Schema.optional(Schema.Array(Schema.String)),
        publishedAt: Schema.String,
        categoryId: Schema.String,
        liveBroadcastContent: Schema.String,
        defaultLanguage: Schema.String,
        localized: Schema.Struct({
          title: Schema.String,
          description: Schema.String,
        }),
        defaultAudioLanguage: Schema.optional(Schema.String),
        thumbnails: Schema.Struct({
          standard: Schema.optional(
            Schema.Struct({
              url: Schema.String,
              width: Schema.Number,
              height: Schema.Number,
            }),
          ),
          default: Schema.Struct({
            url: Schema.String,
            width: Schema.Number,
            height: Schema.Number,
          }),
          medium: Schema.Struct({
            url: Schema.String,
            width: Schema.Number,
            height: Schema.Number,
          }),
          high: Schema.Struct({
            url: Schema.String,
            width: Schema.Number,
            height: Schema.Number,
          }),
          maxres: Schema.optional(
            Schema.Struct({
              url: Schema.String,
              width: Schema.Number,
              height: Schema.Number,
            }),
          ),
        }),
      }),
      contentDetails: Schema.Struct({
        duration: Schema.transform(Schema.String, Schema.Number, {
          decode: str => {
            const match = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
            if (!match) throw new Error(`Invalid duration format: ${str}`)
            const [, hours, minutes, seconds] = match
            return (
              Number(hours ?? 0) * 3600 +
              Number(minutes ?? 0) * 60 +
              Number(seconds ?? 0)
            )
          },
          encode: num =>
            `PT${Math.floor(num / 3600) > 0 ? `${Math.floor(num / 3600)}H` : ''}${
              Math.floor((num % 3600) / 60) > 0
                ? `${Math.floor((num % 3600) / 60)}M`
                : ''
            }${num % 60 > 0 ? `${num % 60}S` : ''}`,
        }),
        dimension: Schema.String,
        definition: Schema.String,
        caption: Schema.BooleanFromString,
        licensedContent: Schema.Boolean,
        projection: Schema.String,
        contentRating: Schema.Struct({
          ytRating: Schema.optional(Schema.String),
        }),
        regionRestriction: Schema.optional(
          Schema.Struct({
            allowed: Schema.optional(Schema.Array(Schema.String)),
            blocked: Schema.optional(Schema.Array(Schema.String)),
          }),
        ),
      }),
      topicDetails: Schema.optionalWith(
        Schema.transform(
          Schema.Struct({
            topicCategories: Schema.Array(Schema.String),
          }),
          Schema.Array(Schema.String),
          {
            decode: ({ topicCategories }) =>
              topicCategories
                .map(e => e.split('/').at(-1))
                .filter((e): e is string => !!e),
            encode: topicCategories => ({ topicCategories }),
            strict: true,
          },
        ),
        {
          default: () => [],
        },
      ),
    }),
  ),
)

const file = File.createFromPath(
  path.join('/nikel_big_downloads/yt-music/', tracksBase[0]!.filename),
)
console.log(file.properties)
file.tag

const asd = pipe(
  content,
  Schema.decodeUnknownSync(contentSchema, {
    onExcessProperty: 'error',
    exact: true,
  }),
  EArray.map(([id, { contentDetails }]) => contentDetails.contentRating),
  EArray.filter(e => Object.keys(e).length > 0),
  // EArray.flatten,
)

console.log([...new Set(asd)])

const tracks = tracksBase
  .map(v => ({
    ...v,
    newAudioTitle: v.audioTitle
      .replaceAll('一', '-')
      .replaceAll('—', '-')
      .replaceAll('–', '-')
      .replaceAll('＂', '"')
      .replaceAll('“', '"')
      .replaceAll('»', '"')
      .replaceAll('«', '"')
      .replaceAll('：', ':')
      .replaceAll('⧸', '/')
      .replaceAll('｜', '|')
      .trim(),
  }))
  .map(v => ({
    ...v,
    matches: v.newAudioTitle
      .matchAll(musicVideoRegexp)
      .toArray()
      .map(m => m[1]!),
    newAudioTitle: v.newAudioTitle
      .replaceAll(musicVideoRegexp, ' ')
      .replaceAll(/[ /|]{1,}$/g, ' ')
      .replaceAll(/\/ CUT$/gi, ' ')
      .replaceAll(doubleSpaceRegex, ' ')
      .trim(),
  }))
  .map(v => ({
    ...v,
    missedMatches: v.newAudioTitle
      .matchAll(/\[[^[\]]+\]|\([^()]+\)|\{[^{}]+\}/g)
      .toArray()
      .map(m => m[0].slice(1, -1).trim()),
  }))
  .filter(v => v.audioTitle !== v.newAudioTitle)
  // .filter(v => v.matches.length === 0)
  .filter(v => v.matches.length > 0)
  // .filter(v => v.missedMatches.length > 0)

  .map(v => ({
    audioTitle: v.audioTitle,
    newAudioTitle: v.newAudioTitle,
    // matches: v.missedMatches,
    matches: v.matches,
  }))

const uniqueMatches = [
  ...new Set(
    tracks.flatMap(t => t.matches).map(e => e.toLowerCase()),
    // .filter(e => !(
    //   e.startsWith('feat')
    //   || e.startsWith('prod')
    //   || e.startsWith('ft')
    //   || e.startsWith('arr')
    //   || e.endsWith('mix')
    //   || e.startsWith('live at')
    //   || e.includes('live')
    //   || e.includes('cover')
    // ))
  ),
]
// console.log(`Found ${uniqueMatches.length} unique junk keywords.`)

pipe(
  uniqueMatches,
  EArray.map((e, i) => [e, i] as const),
  // @ts-expect-error I dont care
  EArray.groupBy(m => Math.floor(m[1] / 9)),
  Object.values,
  // @ts-expect-error I dont care
  EArray.map(e => e.map(v => v[0]).sort((a, b) => b.length - a.length)),
  // console.table
)

console.log(`Found ${tracksBase.length} tracks with junk in their titles.`)
// console.table(tracksBase)
