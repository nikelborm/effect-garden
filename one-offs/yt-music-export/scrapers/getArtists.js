// 1. open https://music.youtube.com/library/artists
// 2. scroll to the bottom

function scrapeArtists() {
  var listRenderers = $$('ytmusic-responsive-list-item-renderer').map(e => ({
    title: [...e.querySelectorAll('.title')],
    image: [...e.querySelectorAll('.image img')],
  }))

  var invalid = listRenderers.filter(
    e => e.title.length !== 1 || e.image.length !== 1,
  )

  if (invalid.length) {
    console.log('found invalid: ', invalid)
    return
  }

  listRenderers = listRenderers.map(e => ({
    title: e.title[0]?.title,
    image: e.image[0]?.src,
  }))

  invalid = listRenderers.filter(e => !e.title || !e.image)

  if (invalid.length) {
    console.log('found invalid2: ', invalid)
    return
  }

  return listRenderers
}

console.log(JSON.stringify(scrapeArtists(), null, 2))
