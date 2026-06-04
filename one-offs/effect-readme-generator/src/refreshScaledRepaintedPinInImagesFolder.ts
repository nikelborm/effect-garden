import * as FileSystem from '@effect/platform/FileSystem'
import * as HttpClient from '@effect/platform/HttpClient'
import * as HttpClientRequest from '@effect/platform/HttpClientRequest'
import * as EArray from 'effect/Array'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as Tuple from 'effect/Tuple'

import { FetchPinImageError } from './errors.ts'
import { getPathToImageInRepoRelativeToRepoRoot } from './getPathToImageInRepo.ts'
import { getDarkThemePinUrlFromGithubReadmeStatsService } from './getPinURLs.ts'
import type { IMiniRepo } from './repo.interface.ts'
import { themes } from './themes.ts'

export const refreshScaledRepaintedPinInImagesFolder = Effect.fn(
  'refreshScaledRepaintedPinInImagesFolder',
)(function* (repo: IMiniRepo) {
  const { originalDarkThemePinSVG, originalDarkThemePinURL } =
    yield* fetchOriginalDarkThemePin(repo)

  const scaledRepaintedPinSVGs = cutOffMarginsAndRepaintRepoPin(
    originalDarkThemePinSVG,
  )

  const fs = yield* FileSystem.FileSystem

  const attemptedPaths = yield* Effect.all(
    Tuple.map(
      themes,
      Effect.fn(function* (theme) {
        const filePath = getPathToImageInRepoRelativeToRepoRoot(repo, theme)
        yield* fs.writeFileString(
          filePath,
          scaledRepaintedPinSVGs[`${theme}ThemePinSVG`],
        )
        return filePath
      }),
    ),
    { concurrency: 'unbounded', mode: 'either' },
  )

  const writtenPaths = EArray.getRights(attemptedPaths)

  yield* Effect.log(
    'Written files:\n' +
      writtenPaths.map(v => '- ' + v).join('\n') +
      '\nThose files are transformed versions of ' +
      originalDarkThemePinURL +
      '\n',
  )

  const writeErrors = EArray.getLefts(attemptedPaths)

  if (writeErrors.length) {
    yield* Effect.logError(
      'Failed to write files:\n' +
        writeErrors.map(v => '- ' + v.message).join('\n') +
        '\nThose files were supposed to be transformed versions of ' +
        originalDarkThemePinURL +
        '\n',
    )
    yield* Effect.failCause(writeErrors.map(Cause.fail).reduce(Cause.parallel))
  }
})

const fetchOriginalDarkThemePin = Effect.fn('fetchOriginalDarkThemePin')(
  function* (repo: IMiniRepo) {
    const originalDarkThemePinURL =
      getDarkThemePinUrlFromGithubReadmeStatsService(repo)

    yield* Effect.log(`Started fetching original repo pin`, repo)

    const client = yield* HttpClient.HttpClient

    const response = yield* client
      .execute(HttpClientRequest.get(originalDarkThemePinURL))
      .pipe(
        Effect.mapError(
          e =>
            new FetchPinImageError({
              url: originalDarkThemePinURL,
              statusCode: e._tag === 'ResponseError' ? e.response.status : 0,
            }),
        ),
      )

    if (response.status !== 200)
      return yield* new FetchPinImageError({
        url: originalDarkThemePinURL,
        statusCode: response.status,
      })

    const result = {
      originalDarkThemePinURL,
      originalDarkThemePinSVG: yield* response.text.pipe(
        Effect.mapError(
          e =>
            new FetchPinImageError({
              url: originalDarkThemePinURL,
              statusCode: e.response.status,
            }),
        ),
      ),
    }

    yield* Effect.log(`Fetched original repo pin`, repo)

    return result
  },
)

function cutOffMarginsAndRepaintRepoPin(originalDarkThemePinSVG: string) {
  const darkThemePinSVG = originalDarkThemePinSVG
    // .replaceAll('#008088', /* title_color  */ 'var(--fgColor-default, var(--color-fg-default))')
    // .replaceAll('#880800', /* text_color   */ 'var(--fgColor-default, var(--color-fg-default))')
    // .replaceAll('#444000', /* icon_color   */ 'var(--button-star-iconColor)')
    // .replaceAll('#202644', /* border_color */ 'var(--borderColor-default,var(--color-border-default,#30363d))')
    // .replaceAll('#202020', /* bg_color     */ 'var(--bgColor-default, var(--color-canvas-default))')
    .replaceAll('height="150"', 'height="115"')
    .replaceAll('height="140"', 'height="105"')
    .replaceAll('height="120"', 'height="85"')
    .replaceAll('viewBox="0 0 400 150"', 'viewBox="24 27 385 100"')
    .replaceAll('viewBox="0 0 400 140"', 'viewBox="24 27 385 90"')
    .replaceAll('viewBox="0 0 400 120"', 'viewBox="24 27 385 70"')
    .replaceAll(/\s+/gm, ' ')

  const lightThemePinSVG = darkThemePinSVG.replaceAll('#f0f6fc', '#1f2328')

  return { darkThemePinSVG, lightThemePinSVG }
}
