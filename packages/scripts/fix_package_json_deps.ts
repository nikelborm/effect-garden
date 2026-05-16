#!/usr/bin/env bun

import { console } from 'node:inspector'
import { join } from 'node:path'

import {
  AbsentProperty,
  OptionalProperty,
  observableExec,
} from '@nikelborm/effect-helpers'

import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as BunContext from '@effect/platform-bun/BunContext'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as EArray from 'effect/Array'
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
  ),
)

export const SubPackageJsonSchema = Schema.parseJson(
  Schema.Struct({
    name: Schema.NonEmptyTrimmedString,
    version: Schema.NonEmptyTrimmedString,
    devDependencies: deps.pipe(OptionalProperty),
    catalog: AbsentProperty,
    dependencies: deps.pipe(OptionalProperty),
  }),
)

export const rootPackageJsonEffect = FileSystem.FileSystem.pipe(
  Effect.flatMap(fs => fs.readFileString(rootPackageJsonPath, 'utf-8')),
  Effect.flatMap(Schema.decode(RootPackageJsonSchema)),
)

export const myMonorepoPackagesDirectoryNamesEffect =
  FileSystem.FileSystem.pipe(
    Effect.flatMap(fs => fs.readDirectory(packagesDirPath)),
    Effect.flatMap(
      Schema.decodeUnknown(Schema.NonEmptyArray(Schema.NonEmptyTrimmedString)),
    ),
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

const ensureProdAndDevDependenciesHaveNoIntersections = Effect.flatMap(
  myMonorepoPackagesEffect,
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
      console.log('\nInstallation into root catalog tasks with human input')
      console.table(installationIntoRootCatalogTasksWithHumanInput)
      throw new Error(
        'Intervention required. Select the desired packages versions and put them into catalog manually',
      )
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
      console.log('\nTasks to install catalog versions of deps')

      console.table(
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
      console.log('Installation into root catalog tasks without human input')

      console.table(additionalCatalogDependencies)

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
      })
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
  })

// TODO: ensure typescript package is in dev deps of everything that doesn't have it
// (except in tsconfig package). check the same shit for every deps of tsconfig
// package, so that I define ts related shit in one place

// TODO: ensure all dirs inside packages folder are installed as devDeps of root
// package, plus playground should be filled with all catalog deps and workspace
// deps and a few others

// TODO: write auto tool that will scan packages folder, and properly fill
// dependencies of root package json, exposing all the stuff, and then will
// properly set dependencies of playground, and then call `bun install`

// TODO: write a helper that will report packages that are `@nikelborm/...`, but have
// versions not equal to `workspace:*`

// TODO: ensure presence of `"@nikelborm/tsconfig": "workspace:*",` everywhere

// TODO: ensure there are no packages with the same name

// TODO: ensure properly added everywhere:
// "@effect/language-service": "catalog:",
// "@nikelborm/tsconfig": "workspace:*",
// "ts-namespace-import": "catalog:",
// "ts-patch": "catalog:",
// "typescript": "catalog:"

// TODO: Add task ensuring effect is in peer deps where necessary instead of hard deps

const addAllDepsToPlaygroundEffect = Effect.gen(function* () {
  const { myMonorepoPackages } = yield* getPackagesInfoEffect

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
    cmd: ['bun', 'add', ...depsToInstall],
    cwd: playgroundPackageDirPath,
    badExitCodeErrorMessage: 'Failed to install dependencies in playground',
  })
})

const fixNonWorkspaceDepsEffect = Effect.gen(function* () {
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
    Effect.fn(function* (pkg) {
      const depsToFix = fixable(pkg.dependencies ?? {})
      const devDepsToFix = fixable(pkg.devDependencies ?? {})

      if (depsToFix.length)
        yield* observableExec({
          cmd: ['bun', 'add', ...depsToFix.map(name => `${name}@workspace:*`)],
          cwd: pkg.directoryPath,
          badExitCodeErrorMessage: `Failed to fix workspace dependencies in ${pkg.name}`,
        })

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
        })
    }),
    { discard: true },
  )
})

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

  const settingsExist = yield* fs.exists(settingsPath)

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
  ensureProdAndDevDependenciesHaveNoIntersections,
  ensureDependenciesOfWorkspacePackagesAreNotDuplicatedAndCatalogized,
  addAllDepsToPlaygroundEffect,
  fixNonWorkspaceDepsEffect,
  ensureVscodeSettingsExistInAllPackages,
]).pipe(Effect.scoped, Effect.provide(BunContext.layer), BunRuntime.runMain)

type Mutable<T> = { -readonly [P in keyof T]: T[P] }
