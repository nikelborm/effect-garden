import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import * as Path from 'effect/Path'

export const createPipRequirementsConfig = Effect.fn(
  'createPipRequirementsConfig',
)(function* (basePath: string) {
  const [fs, path] = yield* Effect.all([FileSystem.FileSystem, Path.Path])

  yield* fs.writeFileString(
    path.join(basePath, 'docker', 'requirements-local.txt'),
    requirements,
  )
})

const requirements = `
psycopg2-binary
pillow
`.slice(1)
