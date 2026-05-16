#!/usr/bin/env bun

import { console } from 'node:inspector'
import { join } from 'node:path'

import {
  AbsentProperty,
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

const deps = Schema.Record({
  key: Schema.NonEmptyTrimmedString,
  value: Schema.NonEmptyTrimmedString,
})

export const RootPackageJsonSchema = Schema.parseJson(
  Schema.Struct(
    {
      name: Schema.NonEmptyTrimmedString,
      version: Schema.NonEmptyTrimmedString,
      dependencies: deps.pipe(OptionalProperty),
      catalog: deps,
      devDependencies: AbsentProperty,
    },
    { key: Schema.String, value: Schema.Unknown },
  ).annotations({ title: 'RootPackageJson' }),
)

export const SubPackageJsonSchema = Schema.parseJson(
  Schema.Struct({
    name: Schema.NonEmptyTrimmedString,
    version: Schema.NonEmptyTrimmedString,
    devDependencies: deps.pipe(OptionalProperty),
    catalog: AbsentProperty,
    dependencies: deps.pipe(OptionalProperty),
  }).annotations({ title: 'SubPackageJson' }),
)

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
      Schema.decode(SubPackageJsonSchema),
    )

    return {
      ...myMonorepoPackage,
      directoryPath: join(packagesDirPath, directoryName),
      allDependencies: {
        ...myMonorepoPackage.dependencies,
        ...myMonorepoPackage.devDependencies,
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
        myMonorepoPackage => {
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
      EArray.flatMap(myMonorepoPackage =>
        pipe(
          myMonorepoPackage.allDependencies,
          Record.map((dependencyVersion, dependencyName) => ({
            dependency: { name: dependencyName, version: dependencyVersion },
            myMonorepoPackage: Struct.pick(
              myMonorepoPackage,
              'name',
              'directoryPath',
            ),
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
    .filter(pkg => currentDeps[pkg.name] !== 'workspace:*')
    .map(pkg => `${pkg.name}@workspace:*`)

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
      EArray.groupBy(_ => _.name),
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
    pkg => pkg.name === '@nikelborm/tsconfig',
  )

  if (!tsconfigPkg) return

  const tsconfigDirectDeps = Object.entries(tsconfigPkg.dependencies ?? {})

  const otherPackages = myMonorepoPackages.filter(
    pkg => pkg.name !== '@nikelborm/tsconfig',
  )

  yield* Effect.forEach(
    otherPackages,
    Effect.fn('ensureTsconfigDepsInPackage')(function* (pkg) {
      yield* Effect.annotateCurrentSpan(
        Struct.pick(pkg, 'name', 'directoryPath'),
      )

      const devDeps = pkg.devDependencies ?? {}

      const toInstall: string[] = []

      if (devDeps['@nikelborm/tsconfig'] !== 'workspace:*')
        toInstall.push('@nikelborm/tsconfig@workspace:*')

      for (const [dep, version] of tsconfigDirectDeps)
        if (!pkg.allDependencies[dep]) toInstall.push(`${dep}@${version}`)

      if (!toInstall.length) return

      yield* Console.log(`\nInstalling missing tsconfig deps into ${pkg.name}:`)
      yield* Console.log(toInstall.join(', '))

      yield* observableExec({
        cmd: ['bun', 'add', '-D', ...toInstall],
        cwd: pkg.directoryPath,
        badExitCodeErrorMessage: `Failed to install tsconfig deps into ${pkg.name}`,
      })
    }),
    { discard: true },
  )
}).pipe(Effect.withSpan('ensureTsconfigDepsAreInAllPackages'))

// TODO: Add task ensuring `effect` and all `@effect/*` prod deps will be
// reinstalled as peer deps. This should not affect the things installed into
// dev deps however. Only move effect related packages from prod to peer. also
// validate all the other code to properly handle this case and to not conflict
// with this task.

const addAllDepsToPlayground = Effect.gen(function* () {
  const myMonorepoPackages = yield* myMonorepoPackagesEffect

  const depsToInstall = pipe(
    myMonorepoPackages,
    EArray.map(pkg => pkg.allDependencies),
    EArray.reduce({} as { [x: string]: string }, (prev, cur) =>
      Object.assign(prev, cur),
    ),
    Record.toEntries,
    EArray.map(([pkgName, pkgVersion]) => pkgName + '@' + pkgVersion),
  )

  yield* observableExec({
    cmd: ['bun', 'add', '-D', ...depsToInstall],
    cwd: playgroundPackageDirPath,
    badExitCodeErrorMessage: 'Failed to install dependencies in playground',
  })
}).pipe(Effect.withSpan('addAllDepsToPlayground'))

const fixNonWorkspaceDeps = Effect.gen(function* () {
  const myMonorepoPackages = yield* myMonorepoPackagesEffect

  const workspacePackageNames = new Set(myMonorepoPackages.map(pkg => pkg.name))

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
      yield* Effect.annotateCurrentSpan(
        Struct.pick(pkg, 'name', 'directoryPath'),
      )

      const depsToFix = fixable(pkg.dependencies ?? {})
      const devDepsToFix = fixable(pkg.devDependencies ?? {})

      if (depsToFix.length)
        yield* observableExec({
          cmd: ['bun', 'add', ...depsToFix.map(name => `${name}@workspace:*`)],
          cwd: pkg.directoryPath,
          badExitCodeErrorMessage: `Failed to fix workspace dependencies in ${pkg.name}`,
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
          badExitCodeErrorMessage: `Failed to fix workspace dev dependencies in ${pkg.name}`,
        }).pipe(Effect.withSpan('fixDevDeps'))
    }),
    { discard: true },
  )
}).pipe(Effect.withSpan('fixNonWorkspaceDeps'))

const REQUIRED_VSCODE_SETTINGS = {
  'js/ts.tsdk.path': '../tsconfig/node_modules/typescript/lib',
  'git.openRepositoryInParentFolders': 'always',
} as const satisfies Record<string, string>

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

  const missingEntries = Object.entries(REQUIRED_VSCODE_SETTINGS).filter(
    ([key, value]) => currentSettings[key] !== value,
  )

  if (!missingEntries.length) return

  const updatedSettings = {
    ...currentSettings,
    ...Object.fromEntries(missingEntries),
  }

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

Effect.all([
  ensureNoPackagesWithSameName,
  ensureProdAndDevDependenciesHaveNoIntersections,
  fixNonWorkspaceDeps,
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
  BunRuntime.runMain,
)

type Mutable<T> = { -readonly [P in keyof T]: T[P] }
