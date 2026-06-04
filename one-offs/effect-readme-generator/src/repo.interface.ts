import * as Schema from 'effect/Schema'

export class Repo extends Schema.TaggedClass<Repo>()('Repo', {
  name: Schema.String,
  owner: Schema.String,
  starCount: Schema.Number,
  forkCount: Schema.Number,
  isItArchived: Schema.Boolean,
  isTemplate: Schema.Boolean,
  lastTimeBeenPushedInto: Schema.NullOr(
    Schema.Union(Schema.DateFromSelf, Schema.DateFromString),
  ),
}) {
  static Chunk = Schema.Chunk(this)
  static ChunkFromJSON = Schema.parseJson(this.Chunk)
}

export type IMiniRepo = Pick<Repo, 'owner' | 'name'>
