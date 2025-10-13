import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'
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

const dirNames = await readdir(packagesDirPath)

const packages = await Promise.all(
  dirNames.map(dir =>
    readFile(join(packagesDirPath, dir, 'package.json'), 'utf8')
      .then(Schema.decodeSync(SubPackageJsonSchema))
      .then(e => ({ ...e, packageDirPath: join(packagesDirPath, dir) })),
  ),
)

// ensure dependencies with devDependencies have no intersections

for (const pkg of packages) {
  const intersection = Record.intersection(
    pkg.dependencies ?? {},
    pkg.devDependencies ?? {},
    (prodVersion, devVersion) => ({ devVersion, prodVersion }),
  )

  if (Object.keys(intersection).length > 0)
    throw new Error(
      `Dev and prod dependencies of ${pkg.name} intersect: ${JSON.stringify(intersection, null, 2)}`,
    )
}

// Ensure packages/ dependencies are not duplicated and put into catalog

const temp = Object.create(null) as Record<
  string,
  [string, { packageDirPath: string; packageName: string }][]
>

const setOrAdd = (
  depName: string,
  depVersion: string,
  cameFrom: { packageDirPath: string; packageName: string },
) => {
  if (temp[depName]) temp[depName].push([depVersion, cameFrom])
  else temp[depName] = [[depVersion, cameFrom]]
}

for (const pkg of packages)
  for (const [depName, depVersion] of Object.entries({
    ...pkg.dependencies,
    ...pkg.devDependencies,
  }))
    setOrAdd(depName, depVersion, {
      packageName: pkg.name,
      packageDirPath: pkg.packageDirPath,
    })

const badApples = Object.entries(temp)
  .filter(([, versions]) => versions.length !== 1)
  .filter(
    ([, versions]) =>
      new Set(versions.map(([v]) => v)).difference(new Set(['workspace:*']))
        .size,
  )
  .filter(
    ([, versions]) =>
      new Set(versions.map(([v]) => v)).difference(new Set(['catalog:'])).size,
  )
  .map(([dep, versions]) => {
    const versionPresentInCatalog = rootPackageJson.catalog[dep] || null
    const uniqueVersions = new Set(versions.map(([v]) => v))
    const uniqueVersionsWithoutCatalog = uniqueVersions.difference(
      new Set(['catalog:']),
    )
    const wouldRequireChoosingVersion =
      !versionPresentInCatalog && uniqueVersionsWithoutCatalog.size > 1

    return [
      dep,
      {
        versionPresentInCatalog,
        packagesInsideOfWhichCatalogDepsWillBeInstalled: versions
          .filter(([version]) => version !== 'catalog:')
          .map(([, cameFrom]) => cameFrom),

        uniqueVersions,
        wouldRequireChoosingVersion,
      },
    ] as const
  })

const badApplesRequiringInstallationIntoRootCatalog = badApples.filter(
  ([, meta]) => !meta.versionPresentInCatalog,
)

const installationIntoRootCatalogTasksWithoutHumanInput =
  badApplesRequiringInstallationIntoRootCatalog
    .filter(([, meta]) => !meta.wouldRequireChoosingVersion)
    .map(([dep, meta]) => [dep, [...meta.uniqueVersions][0]!] as const)

if (installationIntoRootCatalogTasksWithoutHumanInput.length) {
  console.log('Installation into root catalog tasks without human input')

  console.table(
    Object.fromEntries(installationIntoRootCatalogTasksWithoutHumanInput),
  )
}

const installationIntoRootCatalogTasksWithHumanInput =
  badApplesRequiringInstallationIntoRootCatalog
    .filter(([, meta]) => meta.wouldRequireChoosingVersion)
    .map(([dep, meta]) => [dep, [...meta.uniqueVersions]] as const)

if (installationIntoRootCatalogTasksWithHumanInput.length) {
  console.log('\nInstallation into root catalog tasks with human input')
  console.table(
    Object.fromEntries(installationIntoRootCatalogTasksWithHumanInput),
  )
  throw new Error(
    'Intervention required. Select the desired packages versions and put them into catalog manually',
  )
}

const flatTasksToInstallCatalogVersionsOfDeps = badApples.flatMap(
  ([dep, meta]) =>
    meta.packagesInsideOfWhichCatalogDepsWillBeInstalled.map(
      myPackage => [myPackage, dep] as const,
    ),
)

const tasksToInstallCatalogVersionsOfDeps = Object.entries(
  Object.groupBy(
    flatTasksToInstallCatalogVersionsOfDeps,
    ([{ packageDirPath }]) => packageDirPath,
  ),
).map(
  ([myPackageDirPath, groups]) =>
    [myPackageDirPath, groups?.map(([, dep]) => dep) || []] as const,
)

if (tasksToInstallCatalogVersionsOfDeps.length) {
  console.log('\nTasks to install catalog versions of deps')

  console.table(
    tasksToInstallCatalogVersionsOfDeps.map(([myPackageDirPath, deps]) => [
      myPackageDirPath,
      deps.join(', '),
    ]),
  )
}

if (installationIntoRootCatalogTasksWithoutHumanInput.length) {
  const tmp = JSON.parse(rootPackageJsonString)

  tmp.catalog = {
    ...tmp.catalog,
    ...Object.fromEntries(installationIntoRootCatalogTasksWithoutHumanInput),
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

for (const [myPackageDirPath, deps] of tasksToInstallCatalogVersionsOfDeps) {
  console.log('Installing deps at ' + myPackageDirPath)

  const installationExitCode = await Bun.spawn({
    cmd: ['bun', 'add', ...deps.map(e => e + '@catalog:')],
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
