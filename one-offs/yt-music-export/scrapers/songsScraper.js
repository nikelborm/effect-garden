// Paste into Chrome DevTools console on the YouTube Music library page
// Returns JSON array — copy with: copy(JSON.stringify(tracks, null, 2))

// intended for fullscreen scrolled https://music.youtube.com/library/songs

const tracks = $$('ytmusic-responsive-list-item-renderer').map(el => {
  const titleLink = el.querySelector('yt-formatted-string.title a')
  const thumbImg = el.querySelector('ytmusic-thumbnail-renderer img#img')
  const flexCols = el.querySelectorAll(
    '.secondary-flex-columns .flex-column yt-formatted-string',
  )
  const durationEl = el.querySelector('yt-formatted-string.fixed-column')
  const likeEl = el.querySelector('ytmusic-like-button-renderer')

  const artistEl = flexCols[0] ?? null
  const albumEl = flexCols[1] ?? null

  const watchHref = titleLink?.getAttribute('href') ?? null
  // href is "watch?v=VIDEO_ID&list=..." — pull video ID
  const videoId = watchHref
    ? new URLSearchParams(watchHref.split('?')[1]).get('v')
    : null

  // Artist links give individual names; title attr gives combined string
  const artistLinks = artistEl
    ? [...artistEl.querySelectorAll('a')].map(a => ({
        name: a.textContent.trim(),
        channelId: a.getAttribute('href')?.replace('channel/', '') ?? null,
      }))
    : []

  const albumHref = albumEl?.querySelector('a')?.getAttribute('href') ?? null

  // Upgrade thumbnail resolution (YT Music serves w120-h120 by default)
  const coverUrl =
    thumbImg?.src.replace(/w\d+-h\d+(-l\d+-rj)?/, 'w500-h500') ?? null

  return {
    title: titleLink?.textContent.trim() ?? null,
    videoId,
    artists: artistLinks,
    artistsRaw: artistEl?.getAttribute('title') ?? null,
    album: albumEl?.getAttribute('title') ?? null,
    albumId: albumHref?.replace('browse/', '') ?? null,
    duration: durationEl?.getAttribute('title') ?? null, // "2:49"
    durationLabel: durationEl?.getAttribute('aria-label') ?? null, // "2 minutes, 49 seconds"
    liked: likeEl?.getAttribute('like-status') === 'LIKE',
    coverUrl,
  }
})

copy(JSON.stringify(tracks, null, 2))
console.log(`Copied ${tracks.length} tracks to clipboard.`)
