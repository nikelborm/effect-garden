import * as Effect from 'effect/Effect'

import type { VideoId } from '../brands.ts'
import { constructRequest } from '../client.ts'
import { VideoIdMismatchError } from '../errors.ts'
import * as VideoParser from '../parsers/VideoParser.ts'

export const getVideo = Effect.fn('effect-ytmusic/getVideo')(function* (
  videoId: VideoId,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/videoId', videoId)
  const data = yield* constructRequest('player', { videoId })
  const video = yield* VideoParser.parse(data)

  if (video.videoId !== videoId) {
    return yield* new VideoIdMismatchError({
      requested: videoId,
      received: video.videoId,
    })
  }

  yield* Effect.annotateCurrentSpan('effect-ytmusic/video.name', video.name)
  return video
})
