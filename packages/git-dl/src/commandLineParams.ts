import { outdent } from 'outdent'

import {
  type Options,
  text,
  withFallbackConfig,
  withDescription as withOptionDescription,
  withSchema,
} from '@effect/cli/Options'
import { Path } from '@effect/platform/Path'
import {
  nonEmptyString as nonEmptyStringConfig,
  validate as validateConfig,
  withDefault as withConfigDefault,
  withDescription as withConfigDescription,
} from 'effect/Config'
import { flatMap } from 'effect/Effect'
import { pipe } from 'effect/Function'
import { fail, succeed, Type } from 'effect/ParseResult'
import { filter, NonEmptyString, transformOrFail } from 'effect/Schema'

const isGitHubSlug = (s: string) => !!s.match(/^[a-z0-9.\-_]+$/gi)

const invalidGitHubSlugMessage =
  'GitHub handle should have only ASCII letters, digits, and the characters ".", "-", and "_"'

// https://developer.mozilla.org/en-US/docs/Glossary/Slug
const GitHubSlugStringSchema = NonEmptyString.pipe(
  filter(s => isGitHubSlug(s) || invalidGitHubSlugMessage),
)

const withGitHubSlugConfigValidation = validateConfig({
  message: invalidGitHubSlugMessage,
  validation: isGitHubSlug,
})

// const toDoc = <T extends TemplateStringsArray>(arg: T) => {
//   const lines = outdent(arg).split('\n')

//   if (!Tuple.isTupleOfAtLeast(1)(lines)) throw new Error('')

//   return HelpDoc.enumeration(EArray.map(lines, HelpDoc.p))
// }

const pathToEntityInRepoDescription = 'Path to file or directory in repo'

const repoOwnerDescription = outdent`
  This is a username (login handle) of a person owning repo you
  are trying to download from. For example, if the repository's URL is
  \`https://github.com/apache/superset\`, the owner is \`apache\`
`

const repoNameDescription = outdent`
  This is the name handle of the repository you are trying to download
  from. For example, if the repository's URL is
  \`https://github.com/apache/superset\`, the name is \`superset\`
`

const destinationPathDescription = outdent`
  Local path of the downloaded file or directory. If
  "pathToEntityInRepo" points to a file, then last element of the
  destination path will be new file name. If "pathToEntityInRepo" points
  to a directory then all files and directories inside directory at
  "pathToEntityInRepo" will be put into a directory with name equal last
  element of destination path. If the directory doesn't exist, it will
  be automatically created.
`

const gitRefDescription = outdent`
  This is the commit's SHA hash, branch name, tag name, or any other ref
  you want to download from. If you don't specify it, the default branch
  in the repository will be used.
`

const RepoNameConfig = pipe(
  nonEmptyStringConfig('REPO_NAME'),
  withGitHubSlugConfigValidation,
  withConfigDescription(repoNameDescription),
)

const RepoOwnerConfig = pipe(
  nonEmptyStringConfig('REPO_OWNER'),
  withGitHubSlugConfigValidation,
  withConfigDescription(repoOwnerDescription),
)

const DestinationPathConfig = pipe(
  nonEmptyStringConfig('DESTINATION_PATH'),
  withConfigDefault('./destination'),
  withConfigDescription(destinationPathDescription),
)

const PathToEntityInRepoConfig = pipe(
  nonEmptyStringConfig('PATH_TO_ENTITY_IN_REPO'),
  withConfigDefault('.'),
  withConfigDescription(pathToEntityInRepoDescription),
)

const GitRefConfig = pipe(
  nonEmptyStringConfig('GIT_REF'),
  withConfigDefault('HEAD'),
  withConfigDescription(gitRefDescription),
)

const CleanRepoEntityPathString = transformOrFail(
  NonEmptyString,
  NonEmptyString,
  {
    strict: true,
    decode: (dirtyPathToEntityInRepo, _, ast) =>
      flatMap(Path, path => {
        // dot can be there only when that's all there is. path.join(...)
        // removes all './', so '.' will never be just left by themself. If it's
        // there, it's very intentional and no other elements in the path exist.
        const cleanPathToEntityInRepo = path
          .join(dirtyPathToEntityInRepo)
          .replaceAll(/\/?$/g, '')

        if (cleanPathToEntityInRepo.startsWith('..'))
          return fail(
            new Type(
              ast,
              dirtyPathToEntityInRepo,
              "Can't request contents that lie higher than the root of the repo",
            ),
          )
        return succeed(cleanPathToEntityInRepo)
      }),
    encode: succeed,
  },
)

/**
 * Text parameter containing path to a directory or a file inside target repo.
 *
 * Can be passed in two ways:
 * 1. As CLI option `gdl --pathToEntityInRepo nestedFolder/Readme.md`
 * 2. As env variable `PATH_TO_ENTITY_IN_REPO="nestedFolder/Readme.md" gdl`
 *
 * Has default: `.`, which means that if not specified, script will download
 * entire repository (download root directory of the repository)
 *
 * Parameter is automatically validated to not point higher than the root of the
 * repository.
 *
 * @since 0.1.7
 * @category CLI options
 * @constant
 */
export const pathToEntityInRepoCLIOptionBackedByEnv: Options<string> = pipe(
  text(`pathToEntityInRepo`),
  withOptionDescription(pathToEntityInRepoDescription),
  withFallbackConfig(PathToEntityInRepoConfig),
  withSchema(CleanRepoEntityPathString),
)

/**
 * Text parameter containing URL slug of the user which owns the repo.
 *
 * Examples:
 * 1. `apache`
 * 2. `nikelborm`
 *
 * Can be passed in two ways:
 * 1. As CLI option `gdl --repoOwner apache`
 * 2. As env variable `REPO_OWNER="apache" gdl`
 *
 * Doesn`t have defaults and will fail if not specified.
 *
 * Parameter is automatically validated so it can consist of only ASCII letters,
 * digits, and the characters `.`, `-`, and `_`.
 *
 * @since 0.1.7
 * @category CLI options
 * @constant
 */
export const repoOwnerCLIOptionBackedByEnv: Options<string> = pipe(
  text(`repoOwner`),
  withOptionDescription(repoOwnerDescription),
  withFallbackConfig(RepoOwnerConfig),
  withSchema(GitHubSlugStringSchema),
)

/**
 * Text parameter containing URL slug of the repo itself.
 *
 * Examples:
 * 1. `superset`
 * 2. `git-dl`
 *
 * Can be passed in two ways:
 * 1. As CLI option `gdl --repoName superset`
 * 2. As env variable `REPO_NAME="superset" gdl`
 *
 * Doesn`t have defaults and will fail if not specified.
 *
 * Parameter is automatically validated so it can consist of only ASCII letters,
 * digits, and the characters `.`, `-`, and `_`.
 *
 * @since 0.1.7
 * @category CLI options
 * @constant
 */
export const repoNameCLIOptionBackedByEnv: Options<string> = pipe(
  text(`repoName`),
  withOptionDescription(repoNameDescription),
  withFallbackConfig(RepoNameConfig),
  withSchema(GitHubSlugStringSchema),
)

/**
 * Text parameter containing path inside your local file system, your new
 * file/directory will be placed at. Last element of the path will be the name
 * of the new file/directory.
 *
 * Examples:
 * 1. `../docker`
 * 2. `/tmp/Readme.md`
 *
 * Can be passed in two ways:
 * 1. As CLI option `gdl --destinationPath docker`
 * 2. As env variable `DESTINATION_PATH="docker" gdl`
 *
 * Has default: `./destination`, which means that if not specified, script will
 * either create a file or a directory named `destination` inside your current PWD
 * depending on the type of remote target.
 *
 * @since 0.1.7
 * @category CLI options
 * @constant
 * @readonly
 */
export const destinationPathCLIOptionBackedByEnv: Options<string> = pipe(
  text(`destinationPath`),
  withOptionDescription(destinationPathDescription),
  withFallbackConfig(DestinationPathConfig),
)

/**
 * Text parameter containing commit SHA hash, branch name, or tag name you want
 * to download from.
 *
 * Examples:
 * 1. `HEAD`
 * 2. `main`
 * 3. `4.1.1`
 * 4. `dca3efb3dd2a2a75aea32e3561c4104a53f02808`
 * 5. `dca3efb`
 *
 * Can be passed in two ways:
 * 1. As CLI option `gdl --gitRef 4.1.1`
 * 2. As env variable `GIT_REF="4.1.1" gdl`
 *
 * Has default: `HEAD`, which means that if not specified, the default branch in
 * the repository will be used.
 *
 * @since 0.1.7
 * @category CLI options
 * @constant
 */
export const gitRefCLIOptionBackedByEnv: Options<string> = pipe(
  text(`gitRef`),
  withOptionDescription(gitRefDescription),
  withFallbackConfig(GitRefConfig),
)
