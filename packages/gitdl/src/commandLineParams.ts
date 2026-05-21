import { outdent } from 'outdent'

import * as CLIOptions from '@effect/cli/Options'
import * as Path from '@effect/platform/Path'
import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as ParseResult from 'effect/ParseResult'
import * as Schema from 'effect/Schema'

const isGitHubSlug = (s: string) => !!s.match(/^[a-z0-9.\-_]+$/gi)

const invalidGitHubSlugMessage =
  'GitHub handle should have only ASCII letters, digits, and the characters ".", "-", and "_"'

// https://developer.mozilla.org/en-US/docs/Glossary/Slug
const GitHubSlugStringSchema = Schema.NonEmptyString.pipe(
  Schema.filter(s => isGitHubSlug(s) || invalidGitHubSlugMessage),
  // TODO brandify this
)

// TODO change approach to default values. Either remove defaults completely or
// provided an easy way to set for people their own defaults instead of
// comparing them to the hardcoded default value. Also document the helpers for
// overriding defaults in TSDoc of exported CLIOptions objects

const withGitHubSlugConfigValidation = Config.validate({
  message: invalidGitHubSlugMessage,
  validation: isGitHubSlug,
})

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

const RepoNameConfig = EFunction.pipe(
  Config.nonEmptyString('REPO_NAME'),
  withGitHubSlugConfigValidation,
  Config.withDescription(repoNameDescription),
)

const RepoOwnerConfig = EFunction.pipe(
  Config.nonEmptyString('REPO_OWNER'),
  withGitHubSlugConfigValidation,
  Config.withDescription(repoOwnerDescription),
)

const DestinationPathConfig = EFunction.pipe(
  Config.nonEmptyString('DESTINATION_PATH'),
  Config.withDefault('./destination'),
  Config.withDescription(destinationPathDescription),
)

const PathToEntityInRepoConfig = EFunction.pipe(
  Config.nonEmptyString('PATH_TO_ENTITY_IN_REPO'),
  Config.withDefault('.'),
  Config.withDescription(pathToEntityInRepoDescription),
)

const GitRefConfig = EFunction.pipe(
  Config.nonEmptyString('GIT_REF'),
  Config.withDefault('HEAD'),
  Config.withDescription(gitRefDescription),
)

const CleanRepoEntityPathString = Schema.transformOrFail(
  Schema.NonEmptyString,
  Schema.NonEmptyString,
  {
    strict: true,
    decode: (dirtyPathToEntityInRepo, _, ast) =>
      Effect.flatMap(Path.Path, path => {
        // dot can be there only when that's all there is. path.join(...)
        // removes all './', so '.' will never be just left by themself. If it's
        // there, it's very intentional and no other elements in the path exist.
        const cleanPathToEntityInRepo = path
          .join(dirtyPathToEntityInRepo)
          .replaceAll(/\/?$/g, '')

        if (cleanPathToEntityInRepo.startsWith('..'))
          return ParseResult.fail(
            new ParseResult.Type(
              ast,
              dirtyPathToEntityInRepo,
              "Can't request contents that lie higher than the root of the repo",
            ),
          )
        return ParseResult.succeed(cleanPathToEntityInRepo)
      }),
    encode: ParseResult.succeed,
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
export const pathToEntityInRepoCLIOptionBackedByEnv: CLIOptions.Options<string> =
  EFunction.pipe(
    CLIOptions.text(`pathToEntityInRepo`),
    CLIOptions.withDescription(pathToEntityInRepoDescription),
    CLIOptions.withFallbackConfig(PathToEntityInRepoConfig),
    CLIOptions.withSchema(CleanRepoEntityPathString),
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
export const repoOwnerCLIOptionBackedByEnv: CLIOptions.Options<string> =
  EFunction.pipe(
    CLIOptions.text(`repoOwner`),
    CLIOptions.withDescription(repoOwnerDescription),
    CLIOptions.withFallbackConfig(RepoOwnerConfig),
    CLIOptions.withSchema(GitHubSlugStringSchema),
  )

/**
 * Text parameter containing URL slug of the repo itself.
 *
 * Examples:
 * 1. `superset`
 * 2. `gitdl`
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
export const repoNameCLIOptionBackedByEnv: CLIOptions.Options<string> =
  EFunction.pipe(
    CLIOptions.text(`repoName`),
    CLIOptions.withDescription(repoNameDescription),
    CLIOptions.withFallbackConfig(RepoNameConfig),
    CLIOptions.withSchema(GitHubSlugStringSchema),
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
export const destinationPathCLIOptionBackedByEnv: CLIOptions.Options<string> =
  EFunction.pipe(
    CLIOptions.text(`destinationPath`),
    CLIOptions.withDescription(destinationPathDescription),
    CLIOptions.withFallbackConfig(DestinationPathConfig),
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
export const gitRefCLIOptionBackedByEnv: CLIOptions.Options<string> =
  EFunction.pipe(
    CLIOptions.text(`gitRef`),
    CLIOptions.withDescription(gitRefDescription),
    CLIOptions.withFallbackConfig(GitRefConfig),
  )
