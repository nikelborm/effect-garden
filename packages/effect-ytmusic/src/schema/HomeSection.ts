import * as Schema from 'effect/Schema'

import { AlbumDetailed } from './AlbumDetailed.ts'
import { PlaylistDetailed } from './PlaylistDetailed.ts'
import { SongDetailed } from './SongDetailed.ts'

export const HomeSection = Schema.Struct({
  title: Schema.Trimmed.check(Schema.isNonEmpty()),
  contents: Schema.Array(
    Schema.Union([AlbumDetailed, PlaylistDetailed, SongDetailed]),
  ),
}).annotateKey({ title: 'HomeSection' })

export type HomeSection = Schema.Schema.Type<typeof HomeSection>
