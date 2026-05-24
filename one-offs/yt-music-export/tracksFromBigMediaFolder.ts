import { readdir } from 'node:fs/promises'

export const tracksFromBigMediaFolder = (await readdir('/big_media/yt-music/'))
  .map(filename => ({
    filename,

    ...filename.match(
      /(?<audioTitle>.*) \[(?<youtubeId>[a-zA-Z-_\d]*)\]\.(?<extension>[\da-z]*)$/,
    )?.groups,
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
