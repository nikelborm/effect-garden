import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as Effect from 'effect/Effect'

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
