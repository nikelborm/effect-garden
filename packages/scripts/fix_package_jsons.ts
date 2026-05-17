#!/usr/bin/env bun

import { console } from 'node:inspector'
import { join } from 'node:path'

import {
  AbsentProperty,
  NonEmptyRecord,
  OptionalProperty,
  observableExec,
} from '@nikelborm/effect-helpers'
import { prettyPrint } from 'effect-errors'

import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as BunContext from '@effect/platform-bun/BunContext'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as EArray from 'effect/Array'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import { flow, pipe } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Predicate from 'effect/Predicate'
import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'
import * as Struct from 'effect/Struct'
import * as Tuple from 'effect/Tuple'

import {
  packagesDirPath,
  playgroundPackageDirPath,
  projectRootAbsolutePath,
  rootPackageJsonPath,
} from './lib/paths.ts'
import {
  email,
  githubUser,
  gitSshUrl,
  httpsRepoLink,
  httpsUserLink,
  issuesLink,
  vscodeConfig,
} from './newPackage.ts'

const deps = NonEmptyRecord(
  Schema.NonEmptyTrimmedString,
  Schema.NonEmptyTrimmedString,
)

export const RootPackageJsonSchema = Schema.parseJson(
  Schema.Struct(
    {
      name: Schema.NonEmptyTrimmedString,
      // to avoid accidental publishs
      private: Schema.Literal(true),
      version: Schema.NonEmptyTrimmedString,
      dependencies: deps.pipe(OptionalProperty),
      catalog: deps,
      devDependencies: AbsentProperty,
    },
    { key: Schema.String, value: Schema.Unknown },
  ).annotations({ title: 'RootPackageJson' }),
)

const emailSchema = Schema.Literal(email)
const myUserSchema = Schema.Struct({
  name: Schema.Literal(githubUser),
  email: emailSchema,
  url: Schema.Literal(httpsUserLink),
})
const userSchema = Schema.Struct({
  name: Schema.NonEmptyTrimmedString,
  email: Schema.NonEmptyTrimmedString,
  url: Schema.NonEmptyTrimmedString,
})

export const SubPackageJsonSchema = Schema.Struct(
  {
    name: Schema.NonEmptyTrimmedString,
    type: Schema.Literal('module'),
    version: Schema.NonEmptyTrimmedString,

    description: Schema.NonEmptyTrimmedString,
    devDependencies: deps.pipe(OptionalProperty),
    peerDependencies: deps.pipe(OptionalProperty),

    catalog: AbsentProperty,
    dependencies: deps.pipe(OptionalProperty),
    homepage: Schema.TemplateLiteralParser(
      httpsRepoLink,
      `/tree/main/packages/`,
      Schema.NonEmptyTrimmedString,
      `#readme`,
    ),
    bugs: Schema.Struct({
      url: Schema.Literal(issuesLink),
      email: emailSchema,
    }),
    keywords: Schema.NonEmptyArray(Schema.NonEmptyTrimmedString).pipe(
      OptionalProperty,
    ),
    repository: Schema.Struct({
      type: Schema.Literal('git'),
      url: Schema.Literal(gitSshUrl),
      directory: Schema.TemplateLiteralParser(
        'packages/',
        Schema.NonEmptyTrimmedString,
      ),
    }),
    scripts: NonEmptyRecord(
      Schema.NonEmptyTrimmedString,
      Schema.NonEmptyTrimmedString,
    ).pipe(OptionalProperty),
    author: myUserSchema,
    contributors: Schema.Tuple([myUserSchema], userSchema),
    maintainers: Schema.Tuple([myUserSchema], userSchema),
  },
  { key: Schema.String, value: Schema.Unknown },
).pipe(
  Schema.extend(
    Schema.Union(
      Schema.Struct({
        license: Schema.Literal('UNLICENSED'),
        private: Schema.Literal(true),
        publishConfig: AbsentProperty,
      }),
      Schema.Struct({
        license: Schema.Literal('MIT'),
        private: Schema.Literal(false),
        publishConfig: Schema.Struct({
          access: Schema.Literal('public'),
          // TODO: my github actions are a mess right now
          provenance: Schema.Literal(false),
          // TODO: should make creating a separate package.json as well as README, and use this, to create a crafted package folder. for example to not publish "scripts" and other repo-only fields
          // directory: Schema.Literal('dist'),
          // linkDirectory: Schema.Literal(false),
        }),
      }),
    ),
  ),
  Schema.annotations({ title: 'SubPackageJson' }),
)

export const SubPackageJsonSchemaFromString =
  Schema.parseJson(SubPackageJsonSchema)

export type SubPackageJson = (typeof SubPackageJsonSchema)['Encoded']

export const rootPackageJsonEffect = FileSystem.FileSystem.pipe(
  Effect.flatMap(fs => fs.readFileString(rootPackageJsonPath, 'utf-8')),
  Effect.flatMap(Schema.decode(RootPackageJsonSchema)),
  Effect.withSpan('rootPackageJson'),
)

export const myMonorepoPackagesDirectoryNamesEffect =
  FileSystem.FileSystem.pipe(
    Effect.flatMap(fs => fs.readDirectory(packagesDirPath)),
    Effect.flatMap(
      Schema.decodeUnknown(Schema.NonEmptyArray(Schema.NonEmptyTrimmedString)),
    ),
    Effect.withSpan('myMonorepoPackagesDirectoryNames'),
  )

export const getMyMonorepoPackage = Effect.fn('getMyMonorepoPackage')(
  function* (directoryName: string) {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    yield* Effect.annotateCurrentSpan({ directoryName })

    const packageJsonPath = path.join(
      packagesDirPath,
      directoryName,
      'package.json',
    )

    yield* Effect.annotateCurrentSpan({ packageJsonPath })

    const myMonorepoPackage = yield* Effect.flatMap(
      fs.readFileString(packageJsonPath),
      Schema.decode(SubPackageJsonSchemaFromString),
    )

    return {
      myMonorepoPackage,
      directoryName,
      directoryPath: join(packagesDirPath, directoryName),
      allDependencies: {
        ...myMonorepoPackage.dependencies,
        ...myMonorepoPackage.devDependencies,
        ...myMonorepoPackage.peerDependencies,
      },
    }
  },
)

export const myMonorepoPackagesEffect =
  myMonorepoPackagesDirectoryNamesEffect.pipe(
    Effect.flatMap(
      Effect.forEach(getMyMonorepoPackage, { concurrency: 'unbounded' }),
    ),
    Effect.withSpan('myMonorepoPackages'),
  )

export const getPackagesInfoEffect = Effect.all({
  rootPackageJson: rootPackageJsonEffect,
  myMonorepoPackages: myMonorepoPackagesEffect,
})

export class AmbiguousDependencyVersions extends Schema.TaggedError<AmbiguousDependencyVersions>()(
  'AmbiguousDependencyVersions',
  {
    conflicts: Schema.Record({
      key: Schema.NonEmptyTrimmedString,
      value: Schema.Array(Schema.NonEmptyTrimmedString),
    }),
  },
) {
  override get message(): string {
    return `Intervention required. The following dependencies have conflicting versions across packages. Select the desired version and put them into catalog manually:\n${JSON.stringify(this.conflicts, null, 2)}`
  }
}

export class IntersectionOfDevAndProdDeps extends Schema.TaggedError<IntersectionOfDevAndProdDeps>()(
  'IntersectionOfDevAndProdDeps',
  {
    packageName: Schema.NonEmptyTrimmedString,
    intersection: Schema.Record({
      key: Schema.NonEmptyTrimmedString,
      value: Schema.Struct({
        devVersion: Schema.NonEmptyTrimmedString,
        prodVersion: Schema.NonEmptyTrimmedString,
      }),
    }),
  },
) {
  override get message(): string {
    return `Dev and prod dependencies of ${this.packageName} intersect: ${JSON.stringify(this.intersection, null, 2)}`
  }
}

export class DuplicatePackageNames extends Schema.TaggedError<DuplicatePackageNames>()(
  'DuplicatePackageNames',
  {
    duplicates: Schema.Record({
      key: Schema.NonEmptyTrimmedString,
      value: Schema.Array(Schema.NonEmptyTrimmedString),
    }),
  },
) {
  override get message(): string {
    return `Multiple packages share the same name. Fix the package names to proceed:\n${JSON.stringify(this.duplicates, null, 2)}`
  }
}

const ensureProdAndDevDependenciesHaveNoIntersections =
  myMonorepoPackagesEffect.pipe(
    Effect.flatMap(
      Effect.forEach(
        ({ myMonorepoPackage }) => {
          const intersection = Record.intersection(
            myMonorepoPackage.dependencies ?? {},
            myMonorepoPackage.devDependencies ?? {},
            (prodVersion, devVersion) => ({ devVersion, prodVersion }),
          )

          if (Object.keys(intersection).length)
            return new IntersectionOfDevAndProdDeps({
              intersection,
              packageName: myMonorepoPackage.name,
            })

          return Effect.void
        },
        { discard: true },
      ),
    ),
    Effect.withSpan('ensureProdAndDevDependenciesHaveNoIntersections'),
  )

const ensureDependenciesOfWorkspacePackagesAreNotDuplicatedAndCatalogized =
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const dependencyNameToItsInstances = pipe(
      yield* myMonorepoPackagesEffect,
      EArray.flatMap(({ allDependencies, myMonorepoPackage, directoryPath }) =>
        pipe(
          allDependencies,
          Record.map((dependencyVersion, dependencyName) => ({
            dependency: { name: dependencyName, version: dependencyVersion },
            myMonorepoPackage: {
              name: myMonorepoPackage.name,
              directoryPath,
            },
          })),
          Record.values,
        ),
      ),
      EArray.groupBy(_ => _.dependency.name),
    )

    const withoutSetValue = (value: string) => (set: Set<string>) =>
      set.difference(new Set([value]))

    const withoutCatalog = withoutSetValue('catalog:')
    const withoutWorkspace = withoutSetValue('workspace:*')
    const rootPackageJson = yield* rootPackageJsonEffect

    const badDeps = Record.filterMap(
      dependencyNameToItsInstances,
      (dependencyInstances, dependencyName) => {
        if (dependencyInstances.length < 2) return Option.none()

        const uniqueVersions = new Set(
          dependencyInstances.map(_ => _.dependency.version),
        )

        const dependencyVersionPointsOnlyAtWorkspace =
          !withoutWorkspace(uniqueVersions).size

        if (dependencyVersionPointsOnlyAtWorkspace) return Option.none()

        const uniqueVersionsWithoutCatalog = withoutCatalog(uniqueVersions)

        const dependencyVersionPointsOnlyAtCatalog =
          !uniqueVersionsWithoutCatalog.size

        if (dependencyVersionPointsOnlyAtCatalog) return Option.none()

        const versionPresentInCatalog =
          rootPackageJson.catalog[dependencyName] || null

        const wouldRequireChoosingVersionToPutIntoCatalog =
          !versionPresentInCatalog && uniqueVersionsWithoutCatalog.size > 1

        return Option.some({
          dependencyInstances: dependencyInstances,
          uniqueVersionsWithoutCatalog: uniqueVersionsWithoutCatalog,
          versionPresentInCatalog,
          packagesInsideOfWhichCatalogDepsWillBeInstalled: dependencyInstances
            .filter(_ => _.dependency.version !== 'catalog:')
            .map(_ => _.myMonorepoPackage),

          uniqueVersions: uniqueVersions,
          wouldRequireChoosingVersionToPutIntoCatalog,
        })
      },
    )

    const badApplesRequiringInstallationIntoRootCatalog = Record.filter(
      badDeps,
      _ => !_.versionPresentInCatalog,
    )

    const installationIntoRootCatalogTasksWithHumanInput = pipe(
      badApplesRequiringInstallationIntoRootCatalog,
      Record.filter(_ => _.wouldRequireChoosingVersionToPutIntoCatalog),
      Record.map(_ => Array.from(_.uniqueVersions)),
    )

    if (Record.size(installationIntoRootCatalogTasksWithHumanInput)) {
      yield* Console.log(
        '\nInstallation into root catalog tasks with human input',
      )
      yield* Console.table(installationIntoRootCatalogTasksWithHumanInput)
      return yield* new AmbiguousDependencyVersions({
        conflicts: installationIntoRootCatalogTasksWithHumanInput,
      })
    }

    const tasksToInstallCatalogVersionsOfDeps = pipe(
      badDeps,
      Record.toEntries,
      EArray.flatMap(([dependencyName, meta]) =>
        meta.packagesInsideOfWhichCatalogDepsWillBeInstalled.map(
          myMonorepoPackage => ({ myMonorepoPackage, dependencyName }),
        ),
      ),
      EArray.groupBy(_ => _.myMonorepoPackage.directoryPath),
      Record.map(EArray.map(_ => _.dependencyName)),
    )

    if (Record.size(tasksToInstallCatalogVersionsOfDeps)) {
      yield* Console.log('\nTasks to install catalog versions of deps')

      yield* Console.table(
        Record.map(
          tasksToInstallCatalogVersionsOfDeps,
          dependencyNamesToInstall => dependencyNamesToInstall.join(', '),
        ),
      )
    }

    const additionalCatalogDependencies = pipe(
      badApplesRequiringInstallationIntoRootCatalog,
      Record.filter(_ => !_.wouldRequireChoosingVersionToPutIntoCatalog),
      Record.map(
        flow(
          Struct.get('uniqueVersions'),
          EArray.fromIterable,
          Option.liftPredicate(Predicate.isTupleOf(1)),
          Option.map(Tuple.at(0)),
          Option.getOrThrow,
        ),
      ),
    )

    if (Record.size(additionalCatalogDependencies)) {
      yield* Console.log(
        'Installation into root catalog tasks without human input',
      )

      yield* Console.table(additionalCatalogDependencies)

      const tmp: Mutable<typeof rootPackageJson> =
        structuredClone(rootPackageJson)

      tmp.catalog = {
        ...rootPackageJson.catalog,
        ...additionalCatalogDependencies,
      }

      yield* fs.writeFileString(
        rootPackageJsonPath,
        JSON.stringify(tmp, null, 2) + '\n',
      )

      yield* observableExec({
        cmd: ['bun', 'install'],
        cwd: projectRootAbsolutePath,
        badExitCodeErrorMessage:
          'Failed to install added to catalog bun deps into root package',
      }).pipe(Effect.withSpan('installDependenciesInRootAfterUpdatingCatalog'))
    }

    for (const [cwd, dependencyNamesToInstall] of Record.toEntries(
      tasksToInstallCatalogVersionsOfDeps,
    ))
      yield* observableExec({
        cmd: [
          'bun',
          'add',
          ...dependencyNamesToInstall.map(name => name + '@catalog:'),
        ],
        cwd,
        badExitCodeErrorMessage:
          'Failed to install added to catalog bun deps into specific package',
      })
  }).pipe(
    Effect.withSpan(
      'ensureDependenciesOfWorkspacePackagesAreNotDuplicatedAndCatalogized',
    ),
  )

const ensureAllMonorepoPackagesAreRootDeps = Effect.gen(function* () {
  const { rootPackageJson, myMonorepoPackages } = yield* getPackagesInfoEffect

  const currentDeps = rootPackageJson.dependencies ?? {}

  const toInstall = myMonorepoPackages
    .filter(
      ({ myMonorepoPackage }) =>
        currentDeps[myMonorepoPackage.name] !== 'workspace:*',
    )
    .map(({ myMonorepoPackage }) => `${myMonorepoPackage.name}@workspace:*`)

  if (!toInstall.length) return

  yield* Console.log(
    '\nAdding missing workspace packages as root dependencies:',
  )
  yield* Console.log(toInstall.join(', '))

  yield* observableExec({
    cmd: ['bun', 'add', ...toInstall],
    cwd: projectRootAbsolutePath,
    badExitCodeErrorMessage:
      'Failed to add workspace packages as root dependencies',
  })
}).pipe(Effect.withSpan('ensureAllMonorepoPackagesAreRootDeps'))

const ensureNoPackagesWithSameName = myMonorepoPackagesEffect.pipe(
  Effect.flatMap(myMonorepoPackages => {
    const duplicates = pipe(
      myMonorepoPackages,
      EArray.groupBy(_ => _.myMonorepoPackage.name),
      Record.filterMap(packages =>
        packages.length > 1
          ? Option.some(packages.map(_ => _.directoryPath))
          : Option.none(),
      ),
    )

    if (!Record.size(duplicates)) return Effect.void

    return new DuplicatePackageNames({ duplicates })
  }),
  Effect.withSpan('ensureNoPackagesWithSameName'),
)

const ensureTsconfigDepsAreInAllPackages = Effect.gen(function* () {
  const myMonorepoPackages = yield* myMonorepoPackagesEffect

  const tsconfigPkg = myMonorepoPackages.find(
    pkg => pkg.myMonorepoPackage.name === '@nikelborm/tsconfig',
  )

  if (!tsconfigPkg) return

  const tsconfigDirectDeps = Object.entries(
    tsconfigPkg.myMonorepoPackage.dependencies ?? {},
  )

  const otherPackages = myMonorepoPackages.filter(
    pkg => pkg.myMonorepoPackage.name !== '@nikelborm/tsconfig',
  )

  yield* Effect.forEach(
    otherPackages,
    Effect.fn('ensureTsconfigDepsInPackage')(function* (pkg) {
      yield* Effect.annotateCurrentSpan({
        name: pkg.myMonorepoPackage.name,
        directoryPath: pkg.directoryPath,
      })

      const devDeps = pkg.myMonorepoPackage.devDependencies ?? {}

      const toInstall: string[] = []

      if (devDeps['@nikelborm/tsconfig'] !== 'workspace:*')
        toInstall.push('@nikelborm/tsconfig@workspace:*')

      for (const [dep, version] of tsconfigDirectDeps)
        if (!pkg.allDependencies[dep]) toInstall.push(`${dep}@${version}`)

      if (!toInstall.length) return

      yield* Console.log(
        `\nInstalling missing tsconfig deps into ${pkg.myMonorepoPackage.name}:`,
      )
      yield* Console.log(toInstall.join(', '))

      yield* observableExec({
        cmd: ['bun', 'add', '-D', ...toInstall],
        cwd: pkg.directoryPath,
        badExitCodeErrorMessage: `Failed to install tsconfig deps into ${pkg.myMonorepoPackage.name}`,
      })
    }),
    { discard: true },
  )
}).pipe(Effect.withSpan('ensureTsconfigDepsAreInAllPackages'))

const isEffectRelated = (name: string) =>
  name === 'effect' || name.startsWith('@effect/')

const ensureEffectDepsArePeerDeps = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const myMonorepoPackages = yield* myMonorepoPackagesEffect

  const packagesToModify = myMonorepoPackages
    .filter(pkg => pkg.myMonorepoPackage.name !== '@nikelborm/tsconfig')
    .filter(pkg =>
      Object.keys(pkg.myMonorepoPackage.dependencies ?? {}).some(
        isEffectRelated,
      ),
    )

  if (!packagesToModify.length) return

  yield* Effect.forEach(
    packagesToModify,
    Effect.fn('moveEffectDepsInPackage')(function* (_) {
      yield* Effect.annotateCurrentSpan({
        name: _.myMonorepoPackage.name,
        directoryPath: _.directoryPath,
      })

      const effectDepsExtractedFromProdDeps = Record.filter(
        _.myMonorepoPackage.dependencies ?? {},
        (_, name) => isEffectRelated(name),
      )

      if (!Object.keys(effectDepsExtractedFromProdDeps).length) return

      yield* Console.log(
        `\nMoving effect deps to peerDependencies in ${_.myMonorepoPackage.name}:`,
      )
      yield* Console.log(
        Object.keys(effectDepsExtractedFromProdDeps).join(', '),
      )

      const currentProdDeps = _.myMonorepoPackage.dependencies ?? {}
      const currentPeerDeps = _.myMonorepoPackage.peerDependencies ?? {}

      const updatedProdDepsWithoutEffectDeps = Record.filter(
        currentProdDeps,
        (_v, name) => !isEffectRelated(name),
      )

      const updatedPkg = {
        ..._.myMonorepoPackage,
        peerDependencies: {
          ...currentPeerDeps,
          ...effectDepsExtractedFromProdDeps,
        },
      }

      if (Object.keys(updatedProdDepsWithoutEffectDeps).length)
        updatedPkg.dependencies = updatedProdDepsWithoutEffectDeps
      else delete updatedPkg.dependencies

      yield* fs.writeFileString(
        path.join(_.directoryPath, 'package.json'),
        JSON.stringify(updatedPkg, null, 2) + '\n',
      )
    }),
    { concurrency: 'unbounded', discard: true },
  )

  yield* observableExec({
    cmd: ['bun', 'install'],
    cwd: projectRootAbsolutePath,
    badExitCodeErrorMessage:
      'Failed to run bun install after moving effect deps to peer deps',
  }).pipe(Effect.withSpan('bunInstallAfterMovingEffectDeps'))
}).pipe(Effect.withSpan('ensureEffectDepsArePeerDeps'))

const addAllDepsToPlayground = Effect.gen(function* () {
  const myMonorepoPackages = yield* myMonorepoPackagesEffect

  const allDeps: Record<string, string> = pipe(
    myMonorepoPackages,
    EArray.map(pkg => pkg.allDependencies),
    EArray.reduce({} as Record<string, string>, (prev, cur) =>
      Object.assign(prev, cur),
    ),
  )

  const playground = myMonorepoPackages.find(
    pkg => pkg.myMonorepoPackage.name === '@nikelborm/playground',
  )
  if (!playground) return yield* Effect.dieMessage('absurd')

  const existingDevDeps = playground.myMonorepoPackage.devDependencies ?? {}

  const depsToInstall = pipe(
    allDeps,
    Record.toEntries,
    EArray.filter(([name, version]) => existingDevDeps[name] !== version),
    EArray.map(([name, version]) => name + '@' + version),
  )

  if (!depsToInstall.length) return

  yield* observableExec({
    cmd: ['bun', 'add', '-D', ...depsToInstall],
    cwd: playgroundPackageDirPath,
    badExitCodeErrorMessage: 'Failed to install dependencies in playground',
  })
}).pipe(Effect.withSpan('addAllDepsToPlayground'))

const fixNonWorkspaceDeps = Effect.gen(function* () {
  const myMonorepoPackages = yield* myMonorepoPackagesEffect

  const workspacePackageNames = new Set(
    myMonorepoPackages.map(pkg => pkg.myMonorepoPackage.name),
  )

  const fixable = flow(
    Record.filterMap((version: string, name: string) =>
      workspacePackageNames.has(name) && version !== 'workspace:*'
        ? Option.some(version)
        : Option.none(),
    ),
    Record.keys,
  )

  yield* Effect.forEach(
    myMonorepoPackages,
    Effect.fn('fixNonWorkspaceDepsOfPackage')(function* (pkg) {
      yield* Effect.annotateCurrentSpan({
        name: pkg.myMonorepoPackage.name,
        directoryPath: pkg.directoryPath,
      })

      const depsToFix = fixable(pkg.myMonorepoPackage.dependencies ?? {})
      const devDepsToFix = fixable(pkg.myMonorepoPackage.devDependencies ?? {})

      if (depsToFix.length)
        yield* observableExec({
          cmd: ['bun', 'add', ...depsToFix.map(name => `${name}@workspace:*`)],
          cwd: pkg.directoryPath,
          badExitCodeErrorMessage: `Failed to fix workspace dependencies in ${pkg.myMonorepoPackage.name}`,
        }).pipe(Effect.withSpan('fixProdDeps'))

      if (devDepsToFix.length)
        yield* observableExec({
          cmd: [
            'bun',
            'add',
            '-D',
            ...devDepsToFix.map(name => `${name}@workspace:*`),
          ],
          cwd: pkg.directoryPath,
          badExitCodeErrorMessage: `Failed to fix workspace dev dependencies in ${pkg.myMonorepoPackage.name}`,
        }).pipe(Effect.withSpan('fixDevDeps'))

      const peerDepsToFix = fixable(
        pkg.myMonorepoPackage.peerDependencies ?? {},
      )

      if (peerDepsToFix.length)
        yield* observableExec({
          cmd: [
            'bun',
            'add',
            '--peer',
            ...peerDepsToFix.map(name => `${name}@workspace:*`),
          ],
          cwd: pkg.directoryPath,
          badExitCodeErrorMessage: `Failed to fix workspace peer dependencies in ${pkg.myMonorepoPackage.name}`,
        }).pipe(Effect.withSpan('fixPeerDeps'))
    }),
    { discard: true },
  )
}).pipe(Effect.withSpan('fixNonWorkspaceDeps'))

const ensureVscodeSettingsInPackage = Effect.fn(
  'ensureVscodeSettingsInPackage',
)(function* (directoryName: string) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const vscodeDir = path.join(packagesDirPath, directoryName, '.vscode')
  const settingsPath = path.join(vscodeDir, 'settings.json')
  yield* Effect.annotateCurrentSpan({ directoryName, vscodeDir, settingsPath })

  const settingsExist = yield* fs.exists(settingsPath)
  yield* Effect.annotateCurrentSpan({ settingsExist })

  let currentSettings: Record<string, unknown> = {}

  if (settingsExist) {
    const content = yield* fs.readFileString(settingsPath)
    currentSettings = JSON.parse(content) as Record<string, unknown>
  } else {
    yield* fs.makeDirectory(vscodeDir, { recursive: true })
  }

  const missing = Record.filter(
    vscodeConfig,
    (value, key) => currentSettings[key] !== value,
  )

  if (!Record.size(missing)) return

  const updatedSettings = { ...currentSettings, ...missing }

  yield* fs.writeFileString(
    settingsPath,
    JSON.stringify(updatedSettings, null, 2) + '\n',
  )
})

const ensureVscodeSettingsExistInAllPackages =
  myMonorepoPackagesDirectoryNamesEffect.pipe(
    Effect.flatMap(
      Effect.forEach(ensureVscodeSettingsInPackage, {
        concurrency: 'unbounded',
      }),
    ),
    Effect.withSpan('ensureVscodeSettingsExistInAllPackages'),
  )

const program = Effect.all([
  ensureNoPackagesWithSameName,
  ensureProdAndDevDependenciesHaveNoIntersections,
  fixNonWorkspaceDeps,
  ensureEffectDepsArePeerDeps,
  ensureDependenciesOfWorkspacePackagesAreNotDuplicatedAndCatalogized,
  addAllDepsToPlayground,
  ensureVscodeSettingsExistInAllPackages,
  ensureAllMonorepoPackagesAreRootDeps,
  ensureTsconfigDepsAreInAllPackages,
]).pipe(
  Effect.scoped,
  Effect.provide(BunContext.layer),
  Effect.withSpan(import.meta.file),
  Effect.sandbox,
  Effect.catchAll(e => {
    console.error(prettyPrint(e))

    return Effect.fail(e)
  }),
)

if (import.meta.main) BunRuntime.runMain(program)

type Mutable<T> = { -readonly [P in keyof T]: T[P] }
