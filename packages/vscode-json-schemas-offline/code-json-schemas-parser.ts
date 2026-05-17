import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import * as NodePath from '@effect/platform-node/NodePath'
import * as NodeRuntime from '@effect/platform-node/NodeRuntime'
import * as EArray from 'effect/Array'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
import * as ParseResult from 'effect/ParseResult'
import * as Schema from 'effect/Schema'

declare global {
  interface ImportMeta {
    readonly dir: string
    readonly dirname: string
    readonly env: string
    readonly file: string
    readonly path: string
    readonly filename: string
    readonly main: string
  }
}

const SCHEMASTORE_HOSTS = new Set([
  'www.schemastore.org',
  'json.schemastore.org',
  'schemastore.org',
])

const FineURLFromString = Schema.URL.pipe(
  Schema.filter(
    url =>
      url.hostname === url.host ||
      "Please don't complicate my life with port resolution",
  ),
)

declare const Bun: any

// TODO: Maybe it's time to shine for my git-dl?

const parseJsonOrYaml = Schema.transformOrFail(
  Schema.String.annotations({
    description: 'a string to be decoded from JSON/YAML',
  }),
  Schema.Union(
    Schema.Struct({ from: Schema.Literal('yaml'), result: Schema.Unknown }),
    Schema.Struct({ from: Schema.Literal('json'), result: Schema.Unknown }),
  ),
  {
    strict: true,
    decode: (encoded, _, ast) =>
      EFunction.pipe(
        Either.try(() => ({
          from: 'json' as const,
          result: JSON.parse(encoded),
        })),
        Either.orElse(() =>
          Either.try(() => ({
            from: 'yaml' as const,
            result: Bun.YAML.parse(encoded),
          })),
        ),
        Either.mapLeft(
          error => new ParseResult.Type(ast, encoded, getErrorMessage(error)),
        ),
      ),
    encode: (decoded, _, ast) =>
      EFunction.pipe(
        Either.try(() =>
          (decoded.from === 'json' ? JSON : Bun.YAML)['stringify'](
            decoded.result,
          ),
        ),
        Either.mapLeft(
          error => new ParseResult.Type(ast, decoded, getErrorMessage(error)),
        ),
      ),
  },
).annotations({ title: 'parseJsonOrYaml' })

// 2 motherfuckers host YAML, although given how much easier it's to read for
// human, they are actually smarter than everybody else
const CachedFileSchema = Schema.compose(
  parseJsonOrYaml,
  Schema.Struct({
    from: Schema.Literal('json', 'yaml'),
    result: Schema.Struct({
      $id: Schema.optionalWith(Schema.NonEmptyTrimmedString, { exact: true }),
      $schema: Schema.optionalWith(FineURLFromString, { exact: true }),
    }),
  }),
)

const getErrorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e)

const CatalogEntry = Schema.Struct({
  originalRemoteURL: FineURLFromString.pipe(
    Schema.propertySignature,
    Schema.fromKey('url'),
  ),
  fileMatch: Schema.optionalWith(Schema.Array(Schema.NonEmptyTrimmedString), {
    exact: true,
  }),
  name: Schema.NonEmptyTrimmedString,
  description: Schema.String,
  versions: Schema.optionalWith(
    Schema.Record({
      key: Schema.NonEmptyTrimmedString,
      value: FineURLFromString,
    }),
    { exact: true },
  ),
}).pipe(
  schema => ({
    from: schema.annotations({ title: 'CatalogEntryWithoutCache' }),
    to: schema.pipe(
      Schema.typeSchema,
      Schema.extend(
        Schema.Struct({
          cached: Schema.NullOr(CachedFileSchema),
        }),
      ),
      Schema.annotations({ title: 'CatalogEntryWithCache' }),
    ),
  }),
  ({ from, to }) =>
    Schema.transformOrFail(from, to, {
      decode: Effect.fn(function* (decodedSelf, _, ast) {
        const fs = yield* FileSystem.FileSystem
        const path = yield* Path.Path

        const base = path.join(
          import.meta.dir,
          '../vscode-json-schemas-offline',
        )
        const { host, pathname } = decodedSelf.originalRemoteURL
        const dumbPrefix = '/SchemaStore/schemastore/master/src/schemas/json'
        const isSchemaStoreNative =
          SCHEMASTORE_HOSTS.has(host) ||
          (host === 'raw.githubusercontent.com' &&
            pathname.startsWith(dumbPrefix))

        // TODO: reorder domain names by `.`, when the time will cum
        const localSchemstoreSchemaFile = path.join(
          base,
          'schemas',
          ...((pathname === '/' && [host + '.json']) ||
            (!isSchemaStoreNative && [host, pathname]) || [
              host
                .replace(/^raw.githubusercontent.com$/, 'www.schemastore.org')
                .replace(/^json.schemastore.org$/, 'www.schemastore.org')
                .replace(/^schemastore.org$/, 'www.schemastore.org'),
              pathname
                // TODO: PR to fix the `s` typo in upstream schemastore repo
                // TODO: Report this dumbass: github.com/DannyBen/completely/blob/master/schemas/completely.json, why the fuck did he put html page link there??
                // TODO: also report Angular and other motherfuckers who don't expose their relative import URLs (or that's just me who didn't resolve the schema links recursively?...)
                .replace('winutil-preset.json', 'winutil-presets.json')
                .replace(dumbPrefix, ''),
            ]),
        )

        return {
          ...decodedSelf,
          cached: yield* Effect.catchAll(
            fs.readFileString(localSchemstoreSchemaFile),
            error =>
              error._tag === 'SystemError' &&
              error.reason === 'NotFound' &&
              !isSchemaStoreNative
                ? Effect.succeed(null)
                : Effect.fail(
                    new ParseResult.Type(
                      ast,
                      decodedSelf.originalRemoteURL,
                      `Failed to read the cache file: ${error.toString()}`,
                    ),
                  ),
          ),
        }
      }),
      encode: ({ cached, ...forward }) => Effect.succeed(forward),
      strict: true,
    }),
  // Schema.asSchema,
)

const CatalogSchema = Schema.Struct({
  $schema: FineURLFromString,
  version: Schema.JsonNumber,
  schemas: Schema.Array(CatalogEntry).annotations({ concurrency: 5 }),
}).pipe(e => Schema.parseJson(e))

const decodeCatalog = Schema.decode(CatalogSchema, {
  exact: true,
  // onExcessProperty: 'error',
})

const AppLayer = Layer.mergeAll(
  NodePath.layer,
  NodeFileSystem.layer,
  Logger.replace(
    Logger.defaultLogger,
    Logger.prettyLogger({ colors: true, mode: 'browser' }),
  ),
)

Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  console.log('test')
  const base = path.join(import.meta.dir, '../vscode-json-schemas-offline')

  const CATALOG_PATH = path.resolve(
    base,
    'schemastore/src/api/json/catalog.json',
  )

  const parsedCatalog = yield* Effect.flatMap(
    fs.readFileString(CATALOG_PATH),
    decodeCatalog,
  )

  console.log(
    parsedCatalog.schemas
      .filter(e => !e.cached)
      .map(({ originalRemoteURL, description, name }) => ({
        url: originalRemoteURL.toString(),
        name,
        description,
        // ...rest,
      })),
  )
}).pipe(
  Effect.catchTag('ParseError', error => {
    const unfolded = unfoldUntilBranch(error.issue)
    return Console.log(
      unfolded.actual,
      ParseResult.TreeFormatter.formatIssueSync(unfolded),
    )
  }),
  Effect.provide(AppLayer),
  NodeRuntime.runMain,
)

const unfoldUntilBranch = (
  issue: ParseResult.ParseIssue,
): ParseResult.ParseIssue =>
  issue._tag === 'Composite'
    ? EArray.isArray(issue.issues) &&
      EArray.isNonEmptyReadonlyArray(issue.issues)
      ? issue.issues.length > 1
        ? issue
        : unfoldUntilBranch(issue.issues[0])
      : unfoldUntilBranch(issue.issues as ParseResult.ParseIssue)
    : issue._tag === 'Unexpected' ||
        issue._tag === 'Type' ||
        issue._tag === 'Missing' ||
        issue._tag === 'Forbidden'
      ? issue
      : unfoldUntilBranch(issue.issue)
