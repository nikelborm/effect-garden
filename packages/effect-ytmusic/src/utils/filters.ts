import { extractString } from './extract.ts'

export const isTitle = (data: any) => {
  return extractString(data, 'musicVideoType').startsWith('MUSIC_VIDEO_TYPE_')
}

export const isArtist = (data: any) => {
  return ['MUSIC_PAGE_TYPE_USER_CHANNEL', 'MUSIC_PAGE_TYPE_ARTIST'].includes(
    extractString(data, 'pageType'),
  )
}

export const isAlbum = (data: any) => {
  return extractString(data, 'pageType') === 'MUSIC_PAGE_TYPE_ALBUM'
}

export const isDuration = (data: any) => {
  return extractString(data, 'text').match(/(\d{1,2}:)?\d{1,2}:\d{1,2}/)
}
