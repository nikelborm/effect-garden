export const PageType = {
  MUSIC_PAGE_TYPE_ALBUM: 'MUSIC_PAGE_TYPE_ALBUM',
  MUSIC_PAGE_TYPE_PLAYLIST: 'MUSIC_PAGE_TYPE_PLAYLIST',
  MUSIC_VIDEO_TYPE_OMV: 'MUSIC_VIDEO_TYPE_OMV',
} as const
export type PageType = (typeof PageType)[keyof typeof PageType]

export const FE_MUSIC_HOME = 'FEmusic_home'
