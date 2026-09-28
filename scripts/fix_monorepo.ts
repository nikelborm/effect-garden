#!/usr/bin/env bun

import { console } from 'node:inspector'

import {
  AbsentProperty,
  NonEmptyRecord,
  observableExec,
} from '@evadev/effect-helpers'
import { parse as parseTOML, stringify as stringifyTOML } from 'smol-toml'
import sortPackageJson from 'sort-package-json'

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as EArray from 'effect/Array'
import * as Cause from 'effect/Cause'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import { flow, pipe } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Path from 'effect/Path'
import * as Predicate from 'effect/Predicate'
import * as Record from 'effect/Record'
import * as Result from 'effect/Result'
import * as Schema from 'effect/Schema'
import * as Struct from 'effect/Struct'
import * as Tuple from 'effect/Tuple'

import { patchFile } from './lib/patchFile.ts'
import {
  playgroundDirPath,
  projectRootAbsolutePath,
  rootPackageJsonPath,
} from './lib/paths.ts'
import {
  biomeDefaultConfig,
  email,
  githubUser,
  gitSshUrl,
  httpsRepoLink,
  httpsUserLink,
  issuesLink,
  vscodeConfig,
} from './newPackage.ts'

const deps = NonEmptyRecord(
  Schema.Trimmed.check(Schema.isNonEmpty()),
  Schema.Trimmed.check(Schema.isNonEmpty()),
)

export const RootPackageJsonFromStringSchema = Schema.fromJsonString(
  Schema.StructWithRest(
    Schema.Struct({
      name: Schema.Trimmed.check(Schema.isNonEmpty()),
      // to avoid accidental publishs
      private: Schema.Literal(true),
      version: Schema.Trimmed.check(Schema.isNonEmpty()),
      dependencies: deps.pipe(Schema.optionalKey),
      catalog: deps,
      devDependencies: AbsentProperty,
      workspaces: Schema.NonEmptyArray(
        Schema.Union([
          Schema.TemplateLiteralParser([
            Schema.Trimmed.check(Schema.isNonEmpty()),
            '/*',
          ]),
          Schema.Trimmed.check(Schema.isNonEmpty()),
        ]),
      ),
    }),
    [Schema.Record(Schema.String, Schema.Unknown)],
  ).annotateKey({ title: 'RootPackageJson' }),
  { space: 2 },
)

const emailSchema = Schema.Literal(email)
const myUserSchema = Schema.Struct({
  name: Schema.Literal(githubUser),
  email: emailSchema,
  url: Schema.Literal(httpsUserLink),
})
const userSchema = Schema.Struct({
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  email: Schema.Trimmed.check(Schema.isNonEmpty()),
  url: Schema.Trimmed.check(Schema.isNonEmpty()),
})

// TODO: add tooling to maintain options on what's CLI, what's library, what's
// both etc. Create a semantic conventions on the naming, if something is a CLI.
// Like the naming of files, and the wiring of it should be streamlined in the
// build proces. A good idea would be to add a new field to package JSON and
// validate against it. Also make author etc boilerplate fields not pinned in
// the actual package.json's but rather added to JSON's at compile-time. As well
// as validation them against actual directory names etc

// TODO: make effect peer deps sorter put into prod deps for frontend or
// end-apps, which bundle them into final build/binary
const subPackageBaseFields = {
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  type: Schema.Literal('module'),
  version: Schema.Trimmed.check(Schema.isNonEmpty()),

  description: Schema.Trimmed.check(Schema.isNonEmpty()),
  devDependencies: deps.pipe(Schema.optionalKey),
  peerDependencies: deps.pipe(Schema.optionalKey),

  catalog: AbsentProperty,
  dependencies: deps.pipe(Schema.optionalKey),
  homepage: Schema.TemplateLiteralParser([
    `${httpsRepoLink}/tree/main/`,
    Schema.Trimmed.check(Schema.isNonEmpty()),
    `#readme`,
  ]),
  bugs: Schema.Struct({
    url: Schema.Literal(issuesLink),
    email: emailSchema,
  }),
  keywords: Schema.NonEmptyArray(
    Schema.Trimmed.check(Schema.isNonEmpty()),
  ).pipe(Schema.optionalKey),
  repository: Schema.Struct({
    type: Schema.Literal('git'),
    url: Schema.Literal(gitSshUrl),
    directory: Schema.Trimmed.check(Schema.isNonEmpty()),
  }),
  scripts: NonEmptyRecord(
    Schema.Trimmed.check(Schema.isNonEmpty()),
    Schema.Trimmed.check(Schema.isNonEmpty()),
  ).pipe(Schema.optionalKey),
  author: myUserSchema,
  contributors: Schema.TupleWithRest(Schema.Tuple([myUserSchema]), [
    userSchema,
  ]),
  maintainers: Schema.TupleWithRest(Schema.Tuple([myUserSchema]), [userSchema]),
} as const

const subPackageRest = [Schema.Record(Schema.String, Schema.Unknown)] as const

export const SubPackageJsonSchema = Schema.Union([
  Schema.StructWithRest(
    Schema.Struct({
      ...subPackageBaseFields,
      license: Schema.Literal('UNLICENSED'),
      private: Schema.Literal(true),
      publishConfig: AbsentProperty,
    }),
    [...subPackageRest],
  ),
  Schema.StructWithRest(
    Schema.Struct({
      ...subPackageBaseFields,
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
    [...subPackageRest],
  ),
]).pipe(Schema.annotateKey({ title: 'SubPackageJson' }))

export const SubPackageJsonSchemaFromString = Schema.fromJsonString(
  SubPackageJsonSchema,
  { space: 2 },
)

export type SubPackageJson = (typeof SubPackageJsonSchema)['Encoded']

export const rootPackageJsonEffect = FileSystem.FileSystem.pipe(
  Effect.flatMap(fs => fs.readFileString(rootPackageJsonPath, 'utf-8')),
  Effect.flatMap(Schema.decodeEffect(RootPackageJsonFromStringSchema)),
  Effect.withSpan('rootPackageJson'),
  // do not cache them! They change over time, especially because you execute
  // the program twice
)

export const MyMonorepoPackagePathsSchema = Schema.Struct({
  packageDirName: Schema.Trimmed.check(Schema.isNonEmpty()),
  absolutePackageDirPath: Schema.Trimmed.check(Schema.isNonEmpty()),
}).pipe(
  schema =>
    Schema.Union([
      schema.pipe(
        Schema.fieldsAssign({
          workspaceDirName: Schema.Trimmed.check(Schema.isNonEmpty()),
          absoluteWorkspaceDirPath: Schema.Trimmed.check(Schema.isNonEmpty()),
        }),
      ),
      schema,
    ]),
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
  Effect.flatMap(Schema.decodeUnknownEffect(MyMonorepoPackagePathsSchema)),
  Effect.withSpan('myMonorepoPackagesDirectoryPaths'),
  // do not cache them! They change over time, especially because you execute
  // the program twice
)

export class WrongHardcodedPathInPackageJson extends Schema.TaggedError<WrongHardcodedPathInPackageJson>()(
  'WrongHardcodedPathInPackageJson',
  {
    where: Schema.Trimmed.check(Schema.isNonEmpty()),
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

    if (!(yield* fs.exists(packageJsonPath))) return null

    const pkg = yield* Effect.flatMap(
      fs.readFileString(packageJsonPath),
      Schema.decodeEffect(SubPackageJsonSchemaFromString),
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
        Schema.encodeEffect(SubPackageJsonSchemaFromString),
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
  // to skip empty directories
  Effect.map(pkgs => pkgs.filter(pkg => pkg !== null)),
  Effect.withSpan('myMonorepoPackages'),
)

export const getPackagesInfoEffect = Effect.all({
  rootPackageJson: rootPackageJsonEffect,
  myMonorepoPackages: myMonorepoPackagesEffect,
})

export class AmbiguousDependencyVersions extends Schema.TaggedError<AmbiguousDependencyVersions>()(
  'AmbiguousDependencyVersions',
  {
    conflicts: Schema.Record(
      Schema.Trimmed.check(Schema.isNonEmpty()),
      Schema.Array(Schema.Trimmed.check(Schema.isNonEmpty())),
    ),
  },
) {
  override get message(): string {
    return `Intervention required. The following dependencies have conflicting versions across packages. Select the desired version and put them into catalog manually:\n${JSON.stringify(this.conflicts, null, 2)}`
  }
}

export class IntersectionOfDevAndProdDeps extends Schema.TaggedError<IntersectionOfDevAndProdDeps>()(
  'IntersectionOfDevAndProdDeps',
  {
    packageName: Schema.Trimmed.check(Schema.isNonEmpty()),
    intersection: Schema.Record(
      Schema.Trimmed.check(Schema.isNonEmpty()),
      Schema.Struct({
        devVersion: Schema.Trimmed.check(Schema.isNonEmpty()),
        prodVersion: Schema.Trimmed.check(Schema.isNonEmpty()),
      }),
    ),
  },
) {
  override get message(): string {
    return `Dev and prod dependencies of ${this.packageName} intersect: ${JSON.stringify(this.intersection, null, 2)}`
  }
}

export class DuplicatePackageNames extends Schema.TaggedError<DuplicatePackageNames>()(
  'DuplicatePackageNames',
  {
    duplicates: Schema.Record(
      Schema.Trimmed.check(Schema.isNonEmpty()),
      Schema.Array(Schema.Trimmed.check(Schema.isNonEmpty())),
    ),
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

const reinstallDepsInCategory = Effect.fn('reinstallDepsInCategory')(
  function* ({
    deps,
    depType,
    cwd,
    packageName,
  }: {
    deps: ReadonlyArray<{ dep: string; version: string }>
    depType: 'dependencies' | 'devDependencies' | 'peerDependencies'
    cwd: string
    packageName: string
  }) {
    if (!deps.length) return

    const flags =
      depType === 'devDependencies'
        ? ['--dev']
        : depType === 'peerDependencies'
          ? ['--peer']
          : []

    yield* observableExec({
      cmd: ['bun', 'remove', ...deps.map(e => e.dep)],
      cwd,
      badExitCodeErrorMessage: `Failed to remove deps from ${packageName}`,
    })
    yield* observableExec({
      cmd: [
        'bun',
        'add',
        ...flags,
        ...deps.map(({ dep, version }) => `${dep}@${version}`),
      ],
      cwd,
      badExitCodeErrorMessage: `Failed to reinstall deps into ${packageName}`,
    })
  },
)

const ensureDependenciesOfWorkspacePackagesAreNotDuplicatedAndCatalogized =
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const dependencyNameToItsInstances = pipe(
      yield* myMonorepoPackagesEffect,
      EArray.flatMap(({ pkg, absolutePackageDirPath }) =>
        (
          ['dependencies', 'devDependencies', 'peerDependencies'] as const
        ).flatMap(depType =>
          pipe(
            pkg[depType] ?? {},
            Record.map((dependencyVersion, dependencyName) => ({
              dependency: { name: dependencyName, version: dependencyVersion },
              pkg: { name: pkg.name, absolutePackageDirPath },
              depType,
            })),
            Record.values,
          ),
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
        if (dependencyInstances.length < 2) return Result.failVoid

        const uniqueVersions = new Set(
          dependencyInstances.map(_ => _.dependency.version),
        )

        const dependencyVersionPointsOnlyAtWorkspace =
          !withoutWorkspace(uniqueVersions).size

        if (dependencyVersionPointsOnlyAtWorkspace) return Result.failVoid

        const uniqueVersionsWithoutCatalog = withoutCatalog(uniqueVersions)

        const dependencyVersionPointsOnlyAtCatalog =
          !uniqueVersionsWithoutCatalog.size

        if (dependencyVersionPointsOnlyAtCatalog) return Result.failVoid

        const versionPresentInCatalog =
          rootPackageJson.catalog[dependencyName] || null

        const wouldRequireChoosingVersionToPutIntoCatalog =
          !versionPresentInCatalog && uniqueVersionsWithoutCatalog.size > 1

        return Result.succeed({
          dependencyInstances: dependencyInstances,
          uniqueVersionsWithoutCatalog: uniqueVersionsWithoutCatalog,
          versionPresentInCatalog,
          packagesInsideOfWhichCatalogDepsWillBeInstalled: dependencyInstances
            .filter(_ => _.dependency.version !== 'catalog:')
            .map(_ => ({ ..._.pkg, depType: _.depType })),

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
        meta.packagesInsideOfWhichCatalogDepsWillBeInstalled.map(pkg => ({
          pkg,
          dependencyName,
        })),
      ),
      EArray.groupBy(_ => `${_.pkg.absolutePackageDirPath}||${_.pkg.depType}`),
      Record.map(tasks => ({
        absolutePackageDirPath: tasks[0].pkg.absolutePackageDirPath,
        packageName: tasks[0].pkg.name,
        depType: tasks[0].pkg.depType,
        deps: tasks.map(t => ({ dep: t.dependencyName, version: 'catalog:' })),
      })),
    )

    if (Record.size(tasksToInstallCatalogVersionsOfDeps)) {
      yield* Console.log('\nTasks to install catalog versions of deps')

      yield* Console.table(
        Record.map(
          tasksToInstallCatalogVersionsOfDeps,
          ({ deps, depType }) =>
            `[${depType}] ` + deps.map(d => d.dep).join(', '),
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
          Option.map(tuple => Tuple.get(tuple, 0)),
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
        (yield* Schema.encodeEffect(RootPackageJsonFromStringSchema)(newRoot)) +
          '\n',
      )

      yield* observableExec({
        cmd: ['bun', 'install'],
        cwd: projectRootAbsolutePath,
        badExitCodeErrorMessage:
          'Failed to install added to catalog bun deps into root package',
      }).pipe(Effect.withSpan('installDependenciesInRootAfterUpdatingCatalog'))
    }

    for (const { absolutePackageDirPath: cwd, ...rest } of Record.values(
      tasksToInstallCatalogVersionsOfDeps,
    ))
      yield* reinstallDepsInCategory({ cwd, ...rest })
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
          ? Result.succeed(packages.map(_ => _.absolutePackageDirPath))
          : Result.failVoid,
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

      yield* reinstallDepsInCategory({
        deps: toInstall,
        depType: 'devDependencies',
        cwd: pkg.absolutePackageDirPath,
        packageName: pkg.pkg.name,
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
  const { catalog } = yield* rootPackageJsonEffect

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
  if (!playground) return yield* Effect.die(new Error('absurd'))

  const existingDevDeps = playground.pkg.devDependencies ?? {}

  const depsToInstall = pipe(
    allDeps,
    Record.toEntries,
    // deps that live in the root catalog are installed as "catalog:", so that
    // playground never carries a concrete version conflicting with the catalog
    EArray.map(([name, version]) => ({
      dep: name,
      version: name in catalog ? 'catalog:' : version,
    })),
    EArray.filter(({ dep, version }) => existingDevDeps[dep] !== version),
  )

  yield* reinstallDepsInCategory({
    deps: depsToInstall,
    depType: 'devDependencies',
    cwd: playgroundDirPath,
    packageName: 'playground',
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
        ? Result.succeed(version)
        : Result.failVoid,
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

const jsonDecode = (s: string): unknown => JSON.parse(s)
const jsonEncode = (obj: unknown): string => JSON.stringify(obj, null, 2) + '\n'

const plainObjectFieldsFixers = (record: Record<string, any>) =>
  Object.entries(record).map(([key, value]) => ({
    isFine: (input: unknown) =>
      typeof input === 'object' &&
      input !== null &&
      key in input &&
      JSON.stringify((input as any)[key]) === JSON.stringify(value),
    getFixed: (input: unknown) => ({
      ...(typeof input === 'object' && input !== null ? input : {}),
      [key]: value,
    }),
  }))

const ensureVscodeSettingsInPackage = Effect.fn(
  'ensureVscodeSettingsInPackage',
)(function* (paths: MyMonorepoPackagePathBundle) {
  const path = yield* Path.Path

  yield* patchFile({
    filePath: path.join(
      paths.absolutePackageDirPath,
      '.vscode',
      'settings.json',
    ),
    decode: jsonDecode,
    encode: jsonEncode,
    defaultValue: {},
    fixers: [
      ...plainObjectFieldsFixers(
        yield* vscodeConfig(paths.absolutePackageDirPath),
      ),
    ],
  })
})

const ensureMiseTomlInPackage = Effect.fn('ensureMiseTomlInPackage')(function* (
  paths: MyMonorepoPackagePathBundle,
) {
  const path = yield* Path.Path

  yield* patchFile({
    filePath: path.join(paths.absolutePackageDirPath, 'mise.toml'),
    decode: s => parseTOML(s),
    encode: obj => stringifyTOML(obj as Parameters<typeof stringifyTOML>[0]),
    defaultValue: {},
    fixers: [
      {
        isFine: (input: unknown) =>
          typeof input === 'object' &&
          input !== null &&
          'env' in input &&
          typeof input.env === 'object' &&
          input.env !== null &&
          '_' in input.env &&
          typeof input.env._ === 'object' &&
          input.env._ !== null &&
          'path' in input.env._ &&
          typeof input.env._.path === 'object' &&
          input.env._.path !== null &&
          Array.isArray(input.env._.path) &&
          input.env._.path.includes('./node_modules/.bin'),
        getFixed: (input: unknown) => {
          const root: object =
            typeof input === 'object' && input !== null ? input : {}
          const envRaw = 'env' in root ? root.env : undefined
          const env =
            typeof envRaw === 'object' && envRaw !== null ? envRaw : {}
          const underRaw = '_' in env ? env._ : undefined
          const under =
            typeof underRaw === 'object' && underRaw !== null ? underRaw : {}
          const pathRaw = 'path' in under ? under.path : undefined
          const existing: unknown[] = Array.isArray(pathRaw) ? pathRaw : []
          return {
            ...root,
            env: {
              ...env,
              _: { ...under, path: [...existing, './node_modules/.bin'] },
            },
          }
        },
      },
    ],
  })
})

const ensureBiomeJsoncInPackage = Effect.fn('ensureBiomeJsoncInPackage')(
  function* (paths: MyMonorepoPackagePathBundle) {
    const path = yield* Path.Path

    const biomeJsoncPath = path.join(
      paths.absolutePackageDirPath,
      'biome.jsonc',
    )

    yield* patchFile({
      filePath: biomeJsoncPath,
      decode: jsonDecode,
      encode: jsonEncode,
      defaultValue: {},
      fixers: [...plainObjectFieldsFixers(biomeDefaultConfig)],
    })
  },
)

const ensureVscodeSettingsExistInAllPackages =
  myMonorepoPackagePathsEffect.pipe(
    Effect.flatMap(
      Effect.forEach(ensureVscodeSettingsInPackage, {
        concurrency: 'unbounded',
      }),
    ),
    Effect.withSpan('ensureVscodeSettingsExistInAllPackages'),
  )

const ensureMiseTomlExistsInAllPackages = myMonorepoPackagePathsEffect.pipe(
  Effect.flatMap(
    Effect.forEach(ensureMiseTomlInPackage, { concurrency: 'unbounded' }),
  ),
  Effect.withSpan('ensureMiseTomlExistsInAllPackages'),
)

const ensureBiomeJsoncExistsInAllPackages = myMonorepoPackagePathsEffect.pipe(
  Effect.flatMap(
    Effect.forEach(ensureBiomeJsoncInPackage, { concurrency: 'unbounded' }),
  ),
  Effect.withSpan('ensureBiomeJsoncExistsInAllPackages'),
)

const sortPackageJsonEffect = Effect.gen(function* () {
  for (const { pkg, update } of yield* myMonorepoPackagesEffect) {
    const sorted = sortPackageJson(pkg)
    yield* update(sorted)
  }
})

// TODO: stop automatically putting things like @effect/vitest into peer deps (dev only)

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
          return yield* Effect.die(
            new Error(
              'Found package pointing at non-catalog version, while catalog were available\n' +
                JSON.stringify({
                  depName,
                  catalogDepVersion,
                  depType,
                  installedInto: pkg.name,
                }),
            ),
          )

        const seen = catalogPackageNameToUsage.get(depName)
        if (!seen)
          return yield* Effect.die(
            new Error('assertion failed. expected map to be prefilled'),
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
  // A catalog entry used by exactly one package gets inlined into that package
  // as an explicit version. This must not go through
  // `bun add <dep>@<version>`: when the requested specifier equals the catalog
  // value, bun rewrites it back to "catalog:", which would leave a reference to
  // the entry we are deleting.
  // Every `usage.pkg` is a snapshot taken during the same read, so all inlines
  // of one package are collected into a single mutable copy and written once,
  // otherwise each write would clobber the inlines of the previous one.
  const packagesToUpdate: Record<
    string,
    {
      pkg: Struct.Mutable<(typeof myMonorepoPackages)[number]['pkg']>
      update: (typeof myMonorepoPackages)[number]['update']
    }
  > = {}
  let changed = false

  for (const [depName, usage] of catalogPackageNameToUsage) {
    if (usage.type === 'never' || usage.type === 'once') {
      changed = true
      delete newCatalog[depName]
    }
    if (usage.type === 'once') {
      const { absolutePackageDirPath, catalogDepVersion } = usage
      const entry = packagesToUpdate[absolutePackageDirPath] ?? {
        pkg: { ...usage.pkg },
        update: usage.update,
      }
      if (usage.depType === 'dependencies')
        entry.pkg.dependencies = {
          ...entry.pkg.dependencies,
          [depName]: catalogDepVersion,
        }
      else if (usage.depType === 'devDependencies')
        entry.pkg.devDependencies = {
          ...entry.pkg.devDependencies,
          [depName]: catalogDepVersion,
        }
      else
        entry.pkg.peerDependencies = {
          ...entry.pkg.peerDependencies,
          [depName]: catalogDepVersion,
        }
      packagesToUpdate[absolutePackageDirPath] = entry
    }
  }

  for (const { pkg, update } of Object.values(packagesToUpdate))
    yield* update(pkg)

  if (!changed) return

  yield* fs.writeFileString(
    rootPackageJsonPath,
    (yield* Schema.encodeEffect(RootPackageJsonFromStringSchema)({
      ...rootPackageJson,
      catalog: newCatalog,
    })) + '\n',
  )

  if (Object.keys(packagesToUpdate).length)
    yield* observableExec({
      cmd: ['bun', 'install'],
      cwd: projectRootAbsolutePath,
      badExitCodeErrorMessage:
        'Failed to install after inlining single-use catalog deps',
    }).pipe(Effect.withSpan('bunInstallAfterCatalogCleanup'))
}).pipe(Effect.withSpan('ensureCatalogHasNoUnusedOrSinglyUsedEntries'))

const program = Effect.all([
  ensureNoPackagesWithSameName,
  ensureProdAndDevDependenciesHaveNoIntersections,
  fixNonWorkspaceDeps,
  ensureEffectDepsArePeerDeps,
  ensureDependenciesOfWorkspacePackagesAreNotDuplicatedAndCatalogized,
  addAllDepsToPlayground,
  ensureVscodeSettingsExistInAllPackages,
  ensureMiseTomlExistsInAllPackages,
  ensureBiomeJsoncExistsInAllPackages,
  ensureAllMonorepoPackagesAreRootDeps,
  ensureTsconfigDepsAreInAllPackages,
  ensureCatalogHasNoUnusedOrUsedOnceEntries,
  sortPackageJsonEffect,
]).pipe(
  Effect.repeat({ times: 2 }),
  Effect.scoped,
  Effect.provide(BunServices.layer),
  Effect.withSpan(import.meta.file),
  Effect.sandbox,
  Effect.catch(e => {
    console.error(Cause.pretty(e))

    return Effect.fail(e)
  }),
)

if (import.meta.main) BunRuntime.runMain(program)
