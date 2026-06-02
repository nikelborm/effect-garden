import { writeFile } from 'node:fs/promises'

import { outdent } from 'outdent'
import { request } from 'undici'

import { getPathToImageInRepoRelativeToRepoRoot } from './getPathToImageInRepo.ts'
import { getDarkThemePinUrlFromGithubReadmeStatsService } from './getPinURLs.ts'
import type { IMiniRepo } from './repo.interface.ts'
import { themes } from './themes.ts'

export async function refreshScaledRepaintedPinInImagesFolder({
  owner,
  name,
}: IMiniRepo) {
  const { originalDarkThemePinSVG, originalDarkThemePinURL } =
    await fetchOriginalDarkThemePin({ owner, name })
  console.log(`Fetched original repo pin { owner:"${owner}", name:"${name}" }`)

  const scaledRepaintedPinSVGs = cutOffMarginsAndRepaintRepoPin(
    originalDarkThemePinSVG,
  )

  const writtenPaths = await Promise.all(
    themes.map(async theme => {
      const filePath = getPathToImageInRepoRelativeToRepoRoot(
        { owner, name },
        theme,
      )
      await writeFile(filePath, scaledRepaintedPinSVGs[`${theme}ThemePinSVG`])
      return filePath
    }),
  )

  console.log(outdent`
    Written files:
    ${writtenPaths.map(v => '- ' + v).join('\n')}
    Those files are transformed versions of ${originalDarkThemePinURL}\n
  `)
}

async function fetchOriginalDarkThemePin(repo: IMiniRepo) {
  const originalDarkThemePinURL =
    getDarkThemePinUrlFromGithubReadmeStatsService(repo)

  console.log(`Started fetching repo pin ` + JSON.stringify(repo))
  const { statusCode, body } = await request(originalDarkThemePinURL)

  if (statusCode !== 200)
    throw new Error(
      `statusCode=${statusCode}: Failed to fetch repo pin image for ${originalDarkThemePinURL}`,
    )

  return {
    originalDarkThemePinURL,
    originalDarkThemePinSVG: await body.text(),
  }
}

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
