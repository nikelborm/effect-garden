import { readdir, readFile, writeFile } from 'fs/promises'
import { console } from 'inspector'
import { join } from 'path'

import * as EArray from 'effect/Array'
import { flow, pipe } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Predicate from 'effect/Predicate'
import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'
import * as EString from 'effect/String'
import * as Struct from 'effect/Struct'
import * as Tuple from 'effect/Tuple'

import {
  packagesDirPath,
  projectRootAbsolutePath,
  rootPackageJsonPath,
} from './lib/paths.ts'
import {
  AbsentProperty,
  OptionalProperty,
} from './node_modules/@nikelborm/effect-helpers/index.ts'

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

const getPackagesInfo = async () => {
  const rootPackageJsonString = await readFile(rootPackageJsonPath, 'utf-8')

  const rootPackageJson = Schema.decodeSync(RootPackageJsonSchema)(
    rootPackageJsonString,
  )

  const myMonorepoPackagesDirectoryNames = await readdir(packagesDirPath)

  const myMonorepoPackages = await Promise.all(
    myMonorepoPackagesDirectoryNames.map(directoryName =>
      readFile(join(packagesDirPath, directoryName, 'package.json'), 'utf8')
        .then(Schema.decodeSync(SubPackageJsonSchema))
        .then(myMonorepoPackage => ({
          ...myMonorepoPackage,
          directoryPath: join(packagesDirPath, directoryName),
          allDependencies: {
            ...myMonorepoPackage.dependencies,
            ...myMonorepoPackage.devDependencies,
          },
        })),
    ),
  )

  return { rootPackageJsonString, rootPackageJson, myMonorepoPackages }
}

// ensure dependencies with devDependencies have no intersections

let { myMonorepoPackages, rootPackageJson, rootPackageJsonString } =
  await getPackagesInfo()

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
    Record.map(tasksToInstallCatalogVersionsOfDeps, dependencyNamesToInstall =>
      dependencyNamesToInstall.join(', '),
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

const transparentSpawn = async ({
  cmd,
  cwd,
  failureMessage,
}: {
  cmd: string[]
  cwd: string
  failureMessage: string
}) => {
  console.log(
    EString.stripMargin(`
      |$ cd ${cwd}
      |$ ${cmd.join(' ')}
      |
    `),
  )

  const installationExitCode = await Bun.spawn({
    cmd,
    cwd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }).exited

  if (installationExitCode !== 0) throw new Error(failureMessage)
}

if (Record.size(additionalCatalogDependencies)) {
  console.log('Installation into root catalog tasks without human input')

  console.table(additionalCatalogDependencies)

  const tmp = JSON.parse(rootPackageJsonString)

  tmp.catalog = { ...tmp.catalog, ...additionalCatalogDependencies }

  await writeFile(rootPackageJsonPath, JSON.stringify(tmp, null, 2) + '\n')

  await transparentSpawn({
    cmd: ['bun', 'install'],
    cwd: projectRootAbsolutePath,
    failureMessage:
      'Failed to install added to catalog bun deps into root package',
  })
}

for (const [cwd, dependencyNamesToInstall] of Record.toEntries(
  tasksToInstallCatalogVersionsOfDeps,
)) {
  await transparentSpawn({
    cmd: [
      'bun',
      'add',
      ...dependencyNamesToInstall.map(name => name + '@catalog:'),
    ],
    cwd,
    failureMessage:
      'Failed to install added to catalog bun deps into specific package',
  })
}
// ensure typescript package is in dev deps of everything that doesn't have it
// (except in tsconfig package). check the same shit for every deps of tsconfig
// package, so that I define ts related shit in one place

;({ myMonorepoPackages, rootPackageJson } = await getPackagesInfo())

const myMonorepoTsconfigPackage = pipe(
  myMonorepoPackages,
  EArray.filter(x => x.name === '@nikelborm/tsconfig'),
  Option.liftPredicate(Predicate.isTupleOf(1)),
  Option.map(Tuple.at(0)),
  Option.getOrThrow,
)

for (const { devDependencies } of myMonorepoPackages) {
  // if(!)
}

// ensure all dirs inside packages folder are installed as devDeps of root
// package, plus playground should be filled with all catalog deps and workspace
// deps and a few others

// write auto tool that will scan packages folder, and properly fill
// dependencies of root package json, exposing all the stuff, and then will
// properly set dependencies of playground, and then call `bun install`

// write a helper that will report packages that are `@nikelborm/...`, but have
// versions not equal to `workspace:*`

// ensure presence of `"@nikelborm/tsconfig": "workspace:*",` everywhere

// ensure there are no packages with the same name

// ensure properly added everywhere:
// "@effect/language-service": "catalog:",
// "@nikelborm/tsconfig": "workspace:*",
// "ts-namespace-import": "catalog:",
// "ts-patch": "catalog:",
// "typescript": "catalog:"

// ensure version field is present everywhere as well as name
