#!/usr/bin/env bun

import { console } from 'node:inspector'

import {
  AbsentProperty,
  NonEmptyRecord,
  OptionalProperty,
  observableExec,
} from '@evadev/effect-helpers'
import { prettyPrint } from 'effect-errors'
import sortPackageJson from 'sort-package-json'

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
  playgroundDirPath,
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

export const RootPackageJsonFromStringSchema = Schema.parseJson(
  Schema.Struct(
    {
      name: Schema.NonEmptyTrimmedString,
      // to avoid accidental publishs
      private: Schema.Literal(true),
      version: Schema.NonEmptyTrimmedString,
      dependencies: deps.pipe(OptionalProperty),
      catalog: deps,
      devDependencies: AbsentProperty,
      workspaces: Schema.NonEmptyArray(
        Schema.Union(
          Schema.TemplateLiteralParser(Schema.NonEmptyTrimmedString, '/*'),
          Schema.NonEmptyTrimmedString,
        ),
      ),
    },
    { key: Schema.String, value: Schema.Unknown },
  ).annotations({ title: 'RootPackageJson' }),
  { space: 2 },
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

// TODO: add tooling to maintain options on what's CLI, what's library, what's
// both etc. Create a semantic conventions on the naming, if something is a CLI.
// Like the naming of files, and the wiring of it should be streamlined in the
// build proces. A good idea would be to add a new field to package JSON and
// validate against it. Also make author etc boilerplate fields not pinned in
// the actual package.json's but rather added to JSON's at compile-time. As well
// as validation them against actual directory names etc

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
      `${httpsRepoLink}/tree/main/`,
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
      directory: Schema.NonEmptyTrimmedString,
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

export const SubPackageJsonSchemaFromString = Schema.parseJson(
  SubPackageJsonSchema,
  { space: 2 },
)

export type SubPackageJson = (typeof SubPackageJsonSchema)['Encoded']

export const rootPackageJsonEffect = FileSystem.FileSystem.pipe(
  Effect.flatMap(fs => fs.readFileString(rootPackageJsonPath, 'utf-8')),
  Effect.flatMap(Schema.decode(RootPackageJsonFromStringSchema)),
  Effect.withSpan('rootPackageJson'),
  // do not cache them! They change over time, especially because you execute
  // the program twice
)

export const MyMonorepoPackagePathsSchema = Schema.Struct({
  packageDirName: Schema.NonEmptyTrimmedString,
  absolutePackageDirPath: Schema.NonEmptyTrimmedString,
}).pipe(
  schema =>
    Schema.Union(
      Schema.extend(
        schema,
        Schema.Struct({
          workspaceDirName: Schema.NonEmptyTrimmedString,
          absoluteWorkspaceDirPath: Schema.NonEmptyTrimmedString,
        }),
      ),
      schema,
    ),
  Schema.NonEmptyArray,
)

export type MyMonorepoPackagePaths =
  (typeof MyMonorepoPackagePathsSchema)['Type']

export type MyMonorepoPackagePathBundle = MyMonorepoPackagePaths[number]

export const myMonorepoPackagePathsEffect = pipe(
  Effect.all([FileSystem.FileSystem, Path.Path, rootPackageJsonEffect]),
  Effect.flatMap(([fs, path, rootPackage]) =>
    Effect.forEach(rootPackage.workspaces, pattern => {
      if (typeof pattern === 'string')
        return Effect.succeed([
          {
            packageDirName: pattern,
            absolutePackageDirPath: path.join(projectRootAbsolutePath, pattern),
          },
        ])

      const [workspaceDirName] = pattern
      const absoluteWorkspaceDirPath = path.join(
        projectRootAbsolutePath,
        workspaceDirName,
      )

      return Effect.map(
        fs.readDirectory(absoluteWorkspaceDirPath),
        EArray.map(packageDirName => ({
          workspaceDirName,
          packageDirName,
          absoluteWorkspaceDirPath,
          absolutePackageDirPath: path.join(
            absoluteWorkspaceDirPath,
            packageDirName,
          ),
        })),
      )
    }),
  ),
  Effect.map(EArray.flatten),
  Effect.flatMap(Schema.decodeUnknown(MyMonorepoPackagePathsSchema)),
  Effect.withSpan('myMonorepoPackagesDirectoryPaths'),
  // do not cache them! They change over time, especially because you execute
  // the program twice
)

export class WrongHardcodedPathInPackageJson extends Schema.TaggedError<WrongHardcodedPathInPackageJson>()(
  'WrongHardcodedPathInPackageJson',
  {
    where: Schema.NonEmptyTrimmedString,
    expected: Schema.Unknown,
    actual: Schema.Unknown,
  },
) {
  override get message(): string {
    return `Wrong path in package's ${this.where}. Expected ${this.expected}, actual ${this.actual}`
  }
}

export const getMyMonorepoPackage = Effect.fn('getMyMonorepoPackage')(
  function* (pathes: MyMonorepoPackagePathBundle) {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    const packageJsonPath = path.join(
      pathes.absolutePackageDirPath,
      'package.json',
    )

    yield* Effect.annotateCurrentSpan({ ...pathes, packageJsonPath })

    const pkg = yield* Effect.flatMap(
      fs.readFileString(packageJsonPath),
      Schema.decode(SubPackageJsonSchemaFromString),
    )

    yield* Effect.annotateCurrentSpan({
      homepageSegments: pkg.homepage.join(''),
      repositoryDirectorySegments: pkg.repository.directory,
    })

    const packagePathRelativeFromRoot =
      ('workspaceDirName' in pathes ? pathes.workspaceDirName + '/' : '') +
      pathes.packageDirName

    if (pkg.homepage[1] !== packagePathRelativeFromRoot)
      return yield* new WrongHardcodedPathInPackageJson({
        where: 'homepage',
        expected: packagePathRelativeFromRoot,
        actual: pkg.homepage[1],
      })

    if (pkg.repository.directory !== packagePathRelativeFromRoot)
      return yield* new WrongHardcodedPathInPackageJson({
        where: 'repository section',
        expected: packagePathRelativeFromRoot,
        actual: pkg.repository.directory,
      })

    return {
      pkg,
      update: flow(
        Schema.encode(SubPackageJsonSchemaFromString),
        Effect.flatMap(encoded =>
          fs.writeFileString(packageJsonPath, encoded + '\n'),
        ),
      ),
      ...pathes,
      packageJsonPath,
      allDependencies: {
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.peerDependencies,
      },
    }
  },
)

export const myMonorepoPackagesEffect = myMonorepoPackagePathsEffect.pipe(
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
        ({ pkg }) => {
          const intersection = Record.intersection(
            pkg.dependencies ?? {},
            pkg.devDependencies ?? {},
            (prodVersion, devVersion) => ({ devVersion, prodVersion }),
          )

          if (Object.keys(intersection).length)
            return new IntersectionOfDevAndProdDeps({
              intersection,
              packageName: pkg.name,
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
      EArray.flatMap(({ allDependencies, pkg, absolutePackageDirPath }) =>
        pipe(
          allDependencies,
          Record.map((dependencyVersion, dependencyName) => ({
            dependency: { name: dependencyName, version: dependencyVersion },
            pkg: {
              name: pkg.name,
              absolutePackageDirPath,
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
    const withoutWorkspace = withoutSetValue('workspace:^')
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
            .map(_ => _.pkg),

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

    // TODO: ensure when installing catalog versions of deps it doesn't move
    // them from peer/dev deps into prod deps

    const tasksToInstallCatalogVersionsOfDeps = pipe(
      badDeps,
      Record.toEntries,
      EArray.flatMap(([dependencyName, meta]) =>
        meta.packagesInsideOfWhichCatalogDepsWillBeInstalled.map(pkg => ({
          pkg,
          dependencyName,
        })),
      ),
      EArray.groupBy(_ => _.pkg.absolutePackageDirPath),
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

      const newRoot = {
        ...rootPackageJson,
        catalog: {
          ...rootPackageJson.catalog,
          ...additionalCatalogDependencies,
        },
      }

      yield* fs.writeFileString(
        rootPackageJsonPath,
        (yield* Schema.encode(RootPackageJsonFromStringSchema)(newRoot)) + '\n',
      )

      yield* observableExec({
        cmd: ['bun', 'install'],
        cwd: projectRootAbsolutePath,
        badExitCodeErrorMessage:
          'Failed to install added to catalog bun deps into root package',
      }).pipe(Effect.withSpan('installDependenciesInRootAfterUpdatingCatalog'))
    }

    for (const [
      absolutePackageDirPath,
      dependencyNamesToInstall,
    ] of Record.toEntries(tasksToInstallCatalogVersionsOfDeps))
      yield* observableExec({
        cmd: [
          'bun',
          'add',
          ...dependencyNamesToInstall.map(name => name + '@catalog:'),
        ],
        cwd: absolutePackageDirPath,
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
    .filter(({ pkg }) => currentDeps[pkg.name] !== 'workspace:^')
    .map(({ pkg }) => `${pkg.name}@workspace:^`)

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
      EArray.groupBy(_ => _.pkg.name),
      Record.filterMap(packages =>
        packages.length > 1
          ? Option.some(packages.map(_ => _.absolutePackageDirPath))
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
    pkg => pkg.pkg.name === '@evadev/tsconfig',
  )

  if (!tsconfigPkg) return

  const tsconfigDirectDeps = Object.entries(tsconfigPkg.pkg.dependencies ?? {})

  const otherPackages = myMonorepoPackages.filter(
    pkg => pkg.pkg.name !== '@evadev/tsconfig',
  )

  yield* Effect.forEach(
    otherPackages,
    Effect.fn('ensureTsconfigDepsInPackage')(function* (pkg) {
      yield* Effect.annotateCurrentSpan({
        name: pkg.pkg.name,
        absolutePackageDirPath: pkg.absolutePackageDirPath,
      })

      const devDeps = pkg.pkg.devDependencies ?? {}

      const toInstall: { dep: string; version: string }[] = []

      if (devDeps['@evadev/tsconfig'] !== 'workspace:^')
        toInstall.push({ dep: '@evadev/tsconfig', version: 'workspace:^' })

      for (const [dep, version] of tsconfigDirectDeps)
        if (!devDeps[dep]) toInstall.push({ dep, version })

      if (!toInstall.length) return

      yield* Console.log(
        `\nInstalling missing tsconfig deps into ${pkg.pkg.name}:`,
      )
      const installArgs = toInstall.map(
        ({ dep, version }) => `${dep}@${version}`,
      )
      yield* Console.log(installArgs.join(', '))

      // reinstall it manually so it actually moves them from one folder into another
      yield* observableExec({
        cmd: ['bun', 'remove', ...toInstall.map(e => e.dep)],
        cwd: pkg.absolutePackageDirPath,
        badExitCodeErrorMessage: `Failed to remove tsconfig deps from ${pkg.pkg.name}`,
      })
      yield* observableExec({
        cmd: ['bun', 'install', '-D', ...installArgs],
        cwd: pkg.absolutePackageDirPath,
        badExitCodeErrorMessage: `Failed to install tsconfig deps into ${pkg.pkg.name}`,
      })
    }),
    { discard: true },
  )
}).pipe(Effect.withSpan('ensureTsconfigDepsAreInAllPackages'))

const shouldBePeerDep = (name: string) =>
  ['effect', '@types/node', '@types/bun'].includes(name) ||
  name.startsWith('@effect/')

const ensureEffectDepsArePeerDeps = Effect.gen(function* () {
  const packagesToModify = (yield* myMonorepoPackagesEffect)
    .filter(pkg => pkg.pkg.name !== '@evadev/tsconfig')
    .filter(pkg =>
      Object.keys(pkg.pkg.dependencies ?? {}).some(shouldBePeerDep),
    )

  if (!packagesToModify.length) return

  yield* Effect.forEach(
    packagesToModify,
    Effect.fn('moveEffectDepsInPackage')(function* (_) {
      yield* Effect.annotateCurrentSpan({
        name: _.pkg.name,
        absolutePackageDirPath: _.absolutePackageDirPath,
      })

      const effectDepsExtractedFromProdDeps = Record.filter(
        _.pkg.dependencies ?? {},
        (_, name) => shouldBePeerDep(name),
      )

      if (!Object.keys(effectDepsExtractedFromProdDeps).length) return

      yield* Console.log(
        `\nMoving effect deps to peerDependencies in ${_.pkg.name}:`,
      )
      yield* Console.log(
        Object.keys(effectDepsExtractedFromProdDeps).join(', '),
      )

      const currentProdDeps = _.pkg.dependencies ?? {}
      const currentPeerDeps = _.pkg.peerDependencies ?? {}

      const updatedProdDepsWithoutEffectDeps = Record.filter(
        currentProdDeps,
        (_v, name) => !shouldBePeerDep(name),
      )

      const updatedPkg = {
        ..._.pkg,
        peerDependencies: {
          ...currentPeerDeps,
          ...effectDepsExtractedFromProdDeps,
        },
      }

      if (Object.keys(updatedProdDepsWithoutEffectDeps).length)
        updatedPkg.dependencies = updatedProdDepsWithoutEffectDeps
      else delete updatedPkg.dependencies

      yield* _.update(updatedPkg)
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
    pkg => pkg.pkg.name === 'playground',
  )
  if (!playground) return yield* Effect.dieMessage('absurd')

  const existingDevDeps = playground.pkg.devDependencies ?? {}

  const depsToInstall = pipe(
    allDeps,
    Record.toEntries,
    EArray.filter(([name, version]) => existingDevDeps[name] !== version),
    EArray.map(([name, version]) => name + '@' + version),
  )

  if (!depsToInstall.length) return

  yield* observableExec({
    cmd: ['bun', 'add', '--dev', ...depsToInstall],
    cwd: playgroundDirPath,
    badExitCodeErrorMessage: 'Failed to install dependencies in playground',
  })
}).pipe(Effect.withSpan('addAllDepsToPlayground'))

const fixNonWorkspaceDeps = Effect.gen(function* () {
  const myMonorepoPackages = yield* myMonorepoPackagesEffect

  const workspacePackageNames = new Set(
    myMonorepoPackages.map(pkg => pkg.pkg.name),
  )

  const fixable = flow(
    Record.filterMap((version: string, name: string) =>
      workspacePackageNames.has(name) && version !== 'workspace:^'
        ? Option.some(version)
        : Option.none(),
    ),
    Record.keys,
  )

  yield* Effect.forEach(
    myMonorepoPackages,
    Effect.fn('fixNonWorkspaceDepsOfPackage')(function* (_) {
      yield* Effect.annotateCurrentSpan({
        name: _.pkg.name,
        absolutePackageDirPath: _.absolutePackageDirPath,
      })

      for (const depType of [
        'dependencies',
        'devDependencies',
        'peerDependencies',
      ] as const) {
        const toFix = fixable(_.pkg[depType] ?? {})
        if (!toFix.length) continue

        yield* observableExec({
          cmd: [
            'bun',
            'add',
            ...(depType === 'devDependencies'
              ? ['--dev']
              : depType === 'peerDependencies'
                ? ['--peer']
                : []),
            ...toFix.map(name => `${name}@workspace:^`),
          ],
          cwd: _.absolutePackageDirPath,
          badExitCodeErrorMessage: `Failed to fix workspace ${depType} in ${_.pkg.name}`,
        })
      }
    }),
    { discard: true },
  )
}).pipe(Effect.withSpan('fixNonWorkspaceDeps'))

const ensureVscodeSettingsInPackage = Effect.fn(
  'ensureVscodeSettingsInPackage',
)(function* (paths: MyMonorepoPackagePathBundle) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const vscodeDir = path.join(paths.absolutePackageDirPath, '.vscode')
  const settingsPath = path.join(vscodeDir, 'settings.json')
  yield* Effect.annotateCurrentSpan({ settingsPath })

  const settingsExisted = yield* fs.exists(settingsPath)
  yield* Effect.annotateCurrentSpan({ settingsExisted })

  let currentSettings: Record<string, unknown> = {}

  if (settingsExisted) {
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
  myMonorepoPackagePathsEffect.pipe(
    Effect.flatMap(
      Effect.forEach(ensureVscodeSettingsInPackage, {
        concurrency: 'unbounded',
      }),
    ),
    Effect.withSpan('ensureVscodeSettingsExistInAllPackages'),
  )

const sortPackageJsonEffect = Effect.gen(function* () {
  for (const { pkg, update } of yield* myMonorepoPackagesEffect) {
    const sorted = sortPackageJson(pkg)
    yield* update(sorted)
  }
})

const ensureCatalogHasNoUnusedOrUsedOnceEntries = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const {
    rootPackageJson,
    rootPackageJson: { catalog },
    myMonorepoPackages,
  } = yield* getPackagesInfoEffect
  const depTypes = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ] as const

  const catalogPackageNameToUsage = new Map<
    string,
    | { type: 'never' }
    | ({
        type: 'once'
        depType: (typeof depTypes)[number]
        catalogDepVersion: string
      } & (typeof myMonorepoPackages)[number])
    | { type: 'multiple' }
  >(Object.keys(catalog).map(name => [name, { type: 'never' }]))

  catalogLoop: for (const [depName, catalogDepVersion] of Object.entries(
    catalog,
  )) {
    pkgLoop: for (const { pkg, ...rest } of myMonorepoPackages) {
      for (const depType of depTypes) {
        const localDepVersion = pkg[depType]?.[depName]
        if (localDepVersion === undefined) continue
        if (localDepVersion !== 'catalog:')
          return yield* Effect.dieMessage(
            'Found package pointing at non-catalog version, while catalog were available\n' +
              JSON.stringify({
                depName,
                catalogDepVersion,
                depType,
                installedInto: pkg.name,
              }),
          )

        const seen = catalogPackageNameToUsage.get(depName)
        if (!seen)
          return yield* Effect.dieMessage(
            'assertion failed. expected map to be prefilled',
          )

        if (seen.type === 'never') {
          catalogPackageNameToUsage.set(depName, {
            type: 'once',
            depType,
            pkg,
            ...rest,
            catalogDepVersion,
          })
          continue pkgLoop
        }

        if (seen.type === 'once') {
          catalogPackageNameToUsage.set(depName, { type: 'multiple' })
          continue catalogLoop
        }
      }
    }
  }

  const newCatalog = { ...catalog }
  let changed = false

  for (const [depName, usage] of catalogPackageNameToUsage) {
    if (usage.type === 'never' || usage.type === 'once') {
      changed = true
      delete newCatalog[depName]
    }
    if (usage.type === 'once')
      yield* observableExec({
        cmd: [
          'bun',
          'add',
          ...(usage.depType === 'devDependencies'
            ? ['--dev']
            : usage.depType === 'peerDependencies'
              ? ['--peer']
              : []),
          depName + '@' + usage.catalogDepVersion,
        ],
        cwd: usage.absolutePackageDirPath,
        badExitCodeErrorMessage:
          'Failed to install dependency into specific package',
      })
  }

  if (!changed) return

  yield* fs.writeFileString(
    rootPackageJsonPath,
    (yield* Schema.encode(RootPackageJsonFromStringSchema)({
      ...rootPackageJson,
      catalog: newCatalog,
    })) + '\n',
  )
}).pipe(Effect.withSpan('ensureCatalogHasNoUnusedOrSinglyUsedEntries'))

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
  ensureCatalogHasNoUnusedOrUsedOnceEntries,
  sortPackageJsonEffect,
]).pipe(
  Effect.repeatN(2),
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
