import * as EArray from 'effect/Array'
import { pipe } from 'effect/Function'
import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'
import * as Struct from 'effect/Struct'
import { readdir, readFile, writeFile } from 'fs/promises'
import { console } from 'inspector'
import { join } from 'path'
import {
  packagesDirPath,
  projectRootAbsolutePath,
  rootPackageJsonPath,
} from './lib/paths.ts'
import {
  AbsentProperty,
  OptionalProperty,
} from './node_modules/@nikelborm/effect-helpers/index.ts'

const rootPackageJsonString = await readFile(rootPackageJsonPath, 'utf-8')

const deps = Schema.Record({
  key: Schema.NonEmptyTrimmedString,
  value: Schema.NonEmptyTrimmedString,
})

const RootPackageJsonSchema = Schema.parseJson(
  Schema.Struct({
    name: Schema.NonEmptyTrimmedString,
    devDependencies: deps.pipe(OptionalProperty),
    catalog: deps,
    dependencies: AbsentProperty,
  }),
)

const SubPackageJsonSchema = Schema.parseJson(
  Schema.Struct({
    name: Schema.NonEmptyTrimmedString,
    devDependencies: deps.pipe(OptionalProperty),
    catalog: AbsentProperty,
    dependencies: deps.pipe(OptionalProperty),
  }),
)

const rootPackageJson = Schema.decodeSync(RootPackageJsonSchema)(
  rootPackageJsonString,
)

const myMonorepoPackagesDirectoryNames = await readdir(packagesDirPath)

const myMonorepoPackages = await Promise.all(
  myMonorepoPackagesDirectoryNames.map(directoryName =>
    readFile(join(packagesDirPath, directoryName, 'package.json'), 'utf8')
      .then(Schema.decodeSync(SubPackageJsonSchema))
      .then(e => ({
        ...e,
        directoryPath: join(packagesDirPath, directoryName),
      })),
  ),
)

// ensure dependencies with devDependencies have no intersections

for (const myMonorepoPackage of myMonorepoPackages) {
  const intersection = Record.intersection(
    myMonorepoPackage.dependencies ?? {},
    myMonorepoPackage.devDependencies ?? {},
    (prodVersion, devVersion) => ({ devVersion, prodVersion }),
  )

  if (Object.keys(intersection).length > 0)
    throw new Error(
      `Dev and prod dependencies of ${myMonorepoPackage.name} intersect: ${JSON.stringify(intersection, null, 2)}`,
    )
}

// Ensure packages/ dependencies are not duplicated and put into catalog

const dependencyNameToItsInstances = pipe(
  myMonorepoPackages,
  EArray.flatMap(myMonorepoPackage =>
    pipe(
      {
        ...myMonorepoPackage.dependencies,
        ...myMonorepoPackage.devDependencies,
      },
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

const badDeps = pipe(
  dependencyNameToItsInstances,
  Record.map(dependencyInstances => ({
    dependencyInstances,
    uniqueVersions: new Set(dependencyInstances.map(_ => _.dependency.version)),
  })),
  Record.map(_ => ({
    ..._,
    uniqueVersionsWithoutCatalog: withoutCatalog(_.uniqueVersions),
  })),
  Record.filter(_ => _.dependencyInstances.length > 1),
  Record.filter(_ => Boolean(withoutWorkspace(_.uniqueVersions).size)),
  Record.filter(_ => Boolean(_.uniqueVersionsWithoutCatalog.size)),
  Record.toEntries,
  EArray.map(([dependencyName, meta]) => {
    const versionPresentInCatalog =
      rootPackageJson.catalog[dependencyName] || null

    const wouldRequireChoosingVersion =
      !versionPresentInCatalog && meta.uniqueVersionsWithoutCatalog.size > 1

    return {
      dependencyName,
      versionPresentInCatalog,
      packagesInsideOfWhichCatalogDepsWillBeInstalled: meta.dependencyInstances
        .filter(_ => _.dependency.version !== 'catalog:')
        .map(_ => _.myMonorepoPackage),

      uniqueVersions: meta.uniqueVersions,
      wouldRequireChoosingVersion,
    }
  }),
)

const badApplesRequiringInstallationIntoRootCatalog = badDeps.filter(
  _ => !_.versionPresentInCatalog,
)

const installationIntoRootCatalogTasksWithHumanInput =
  badApplesRequiringInstallationIntoRootCatalog
    .filter(_ => _.wouldRequireChoosingVersion)
    .map(
      ({ dependencyName, uniqueVersions }) =>
        [dependencyName, Array.from(uniqueVersions)] as const,
    )

if (installationIntoRootCatalogTasksWithHumanInput.length) {
  console.log('\nInstallation into root catalog tasks with human input')
  console.table(
    Object.fromEntries(installationIntoRootCatalogTasksWithHumanInput),
  )
  throw new Error(
    'Intervention required. Select the desired packages versions and put them into catalog manually',
  )
}

const tasksToInstallCatalogVersionsOfDeps = pipe(
  badDeps,
  EArray.flatMap(
    ({ packagesInsideOfWhichCatalogDepsWillBeInstalled, dependencyName }) =>
      packagesInsideOfWhichCatalogDepsWillBeInstalled.map(
        myMonorepoPackage => ({ myMonorepoPackage, dependencyName }),
      ),
  ),
  EArray.groupBy(_ => _.myMonorepoPackage.directoryPath),
  Record.map(EArray.map(_ => _.dependencyName)),
  Record.toEntries,
  EArray.map(([myPackageDirPath, dependencyNamesToInstall]) => ({
    myPackageDirPath,
    dependencyNamesToInstall,
  })),
)

if (tasksToInstallCatalogVersionsOfDeps.length) {
  console.log('\nTasks to install catalog versions of deps')

  console.table(
    tasksToInstallCatalogVersionsOfDeps.map(
      ({ myPackageDirPath, dependencyNamesToInstall }) => [
        myPackageDirPath,
        dependencyNamesToInstall.join(', '),
      ],
    ),
  )
}

const additionalCatalogDependencies = pipe(
  badApplesRequiringInstallationIntoRootCatalog,
  EArray.flatMapNullable(problematicDependency =>
    problematicDependency.wouldRequireChoosingVersion
      ? null
      : ([
          problematicDependency.dependencyName,
          [...problematicDependency.uniqueVersions][0]!,
        ] as const),
  ),
  Record.fromEntries,
)

if (Record.size(additionalCatalogDependencies)) {
  console.log('Installation into root catalog tasks without human input')

  console.table(additionalCatalogDependencies)

  const tmp = JSON.parse(rootPackageJsonString)

  tmp.catalog = {
    ...tmp.catalog,
    ...additionalCatalogDependencies,
  }

  await writeFile(rootPackageJsonPath, JSON.stringify(tmp, null, 2) + '\n')

  const installationExitCode = await Bun.spawn({
    cmd: ['bun', 'install'],
    cwd: projectRootAbsolutePath,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }).exited

  if (installationExitCode !== 0)
    throw new Error('Failed to install added to catalog bun deps')
}

for (const {
  myPackageDirPath,
  dependencyNamesToInstall,
} of tasksToInstallCatalogVersionsOfDeps) {
  console.log('Installing deps at ' + myPackageDirPath)

  const installationExitCode = await Bun.spawn({
    cmd: [
      'bun',
      'add',
      ...dependencyNamesToInstall.map(name => name + '@catalog:'),
    ],
    cwd: myPackageDirPath,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }).exited

  if (installationExitCode !== 0)
    throw new Error('Failed to install added to catalog bun deps')
}

// ensure typescript package is in dev deps of everything that doesn't have it
// (except in tsconfig package). check the same shit for every deps of tsconfig
// package, so that I define ts related shit in one place

// ensure all dirs inside packages folder are installed as devDeps of root
// package, plus playground should be filled with all catalog deps and workspace
// deps and a few others

// write auto tool that will scan packages folder, and properly fill
// dependencies of root package json, exposing all the stuff, and then will
// properly set dependencies of playground, and then call `bun install`

// write a helper that will report packages that are `@nikelborm/...`, but have
// versions not equal to `workspace:*`

// ensure presence of `"@nikelborm/tsconfig": "workspace:*",` everywhere
