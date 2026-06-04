import path from 'node:path'

import { outdent } from 'outdent'
import { z } from 'zod'

import {
  getDarkThemePinUrlFromGithubReadmeStatsService,
  getUrlOfScaledRepaintedRepoPinInGithubCdn,
} from './getPinURLs.ts'
import type { IMiniRepo } from './repo.interface.ts'
import { themes } from './themes.ts'

const renderBothThemesWhen = new Set([
  '',
  undefined,
  null,
  'both',
  'null',
  'any',
  'all',
  'every',
  'each',
])

export const getScaledRepaintedMarkdownPin = (
  repo: IMiniRepo,
  themeToRenderExclusively?: string | undefined | null,
) =>
  themes
    .map(theme =>
      renderBothThemesWhen.has(themeToRenderExclusively) ||
      themeToRenderExclusively === theme
        ? getMarkdownPin(
            repo.name,
            getUrlOfScaledRepaintedRepoPinInGithubCdn(repo, theme),
            `${getRepoURL(repo)}#gh-${theme}-mode-only`,
          )
        : '',
    )
    .join('')

export function getOriginalDarkThemeMarkdownPin(repo: IMiniRepo) {
  return getMarkdownPin(
    repo.name,
    getDarkThemePinUrlFromGithubReadmeStatsService(repo),
    getRepoURL(repo),
  )
}

function getMarkdownPin(name: string, pinURL: string, repoURL: string) {
  return `[![${name} repo](${pinURL})](${repoURL})`
}

function getRepoURL({ owner, name }: IMiniRepo) {
  return `https://github.com/${owner}/${name}/`
}

export function extractReposFromMarkdownStrict(markdownText: string) {
  return [...markdownText.matchAll(markdownPinRegex)].map(({ groups }) =>
    parseMarkdownPinRegexMatchGroup(groups),
  )
}

export function extractReposFromMarkdownSoft(markdownText: string) {
  return [...markdownText.matchAll(markdownPinRegex)]
    .map(({ groups }) => {
      try {
        return parseMarkdownPinRegexMatchGroup(groups)
      } catch {
        return null
      }
    })
    .filter((x): x is Exclude<typeof x, null> => !!x)
}

function parsePathToImageInsideRepo(pathToImageInsideRepo: string) {
  if (path.dirname(pathToImageInsideRepo) !== 'images')
    throw new Error(outdent`
      Folder with image from what appears to be the GitHub CDN link,
      has name other than "images".
    `)

  const match = path
    .basename(pathToImageInsideRepo)
    .match(
      /^(?<username>[^,]+),(?<repoName>[^,]+),(?<themeName>[^,]+)_theme\.svg$/,
    )

  const result = imageFileNameElements.safeParse(match?.groups)

  if (!result.success)
    throw new Error("Image filename doesn't follow naming convention.", {
      cause: result.error,
    })

  return result.data
}

const imageFileNameElements = z
  .object({
    username: z.string().min(1),
    repoName: z.string().min(1),
    themeName: z.enum(themes),
  })
  .strict()

const MarkdownRepoPinZodSchema = z
  .object({
    repoNameFromPinImageAltText: z.string().min(1),
    repoPinImageURL: z
      .url()
      .min(50)

      .transform(val => new URL(val)),
    repoURL: z
      .url()
      .min(22)
      .transform(val => new URL(val)),
  })
  .strict()

const markdownPinRegex =
  /\[!\[(?<repoNameFromPinImageAltText>[^[\]()]+) repo\]\((?<repoPinImageURL>https?:\/\/(github-readme-stats\.vercel\.app\/api\/pin|raw\.githubusercontent\.com)[^[\]()]+)\)\]\((?<repoURL>[^[\]()]+)\)/g

function parseMarkdownPinRegexMatchGroup(
  markdownRegexPinMatchGroup?: Record<string, string>,
) {
  const { repoURL, repoPinImageURL, repoNameFromPinImageAltText } =
    MarkdownRepoPinZodSchema.parse(markdownRegexPinMatchGroup)

  let usernameFromPinURL: string
  let repoNameFromPinURL: string
  let additionalContext: { imageHost: string; themeName: 'dark' | 'light' }

  // see:
  // https://vscode.dev/github/nikelborm/nikelborm/blob/main/src/getPinURLs.ts#L6
  // file://./getPinURLs.ts

  if (repoPinImageURL.host === ('github-readme-stats.vercel.app' as const)) {
    const rawRepo = repoPinImageURL.searchParams.get('repo')
    if (!rawRepo)
      throw new Error(outdent`
        pinURL that looks like github-readme-stats link doesn\'t have
        "repo" query param
      `)
    repoNameFromPinURL = rawRepo

    const rawUsername = repoPinImageURL.searchParams.get('username')
    if (!rawUsername)
      throw new Error(outdent`
        pinURL that looks like github-readme-stats link doesn\'t have
        "username" query param
      `)
    usernameFromPinURL = rawUsername

    additionalContext = {
      themeName: 'dark',
      imageHost: repoPinImageURL.host,
    }
  } else if (repoPinImageURL.host === ('raw.githubusercontent.com' as const)) {
    const [owner, sameOwner, ...rest] = repoPinImageURL.pathname
      .split('/')
      .filter(Boolean)

    if (!owner)
      throw new Error(outdent`
        The first path element of what appears to be the GitHub CDN link
        isn't present. It should represent owner's login, but it's empty.
      `)

    if (!sameOwner)
      throw new Error(outdent`
        The second path element of what appears to be the GitHub CDN link
        isn't present. It should represent repo name, but it's empty.
      `)

    if (owner !== sameOwner)
      throw new Error(outdent`
        The first and the second path elements of what appears to be the
        GitHub CDN link aren't equal. They should be equal, because this
        link supposed to point at GitHub profile's Readme, which should
        have been in repo with the same name as owner's login.
      `)

    usernameFromPinURL = owner

    const {
      username: usernameFromImageFileName,
      repoName: repoNameFromImageFileName,
      themeName,
    } = parsePathToImageInsideRepo(path.join(...rest.slice(3)))

    if (usernameFromPinURL !== usernameFromImageFileName)
      throw new Error(outdent`
        The first part of image name is not equal to any of the first 2
        path elements of what appears to be the GitHub CDN link. It
        should be, because it should point to the same owner.
      `)

    repoNameFromPinURL = repoNameFromImageFileName

    additionalContext = {
      imageHost: repoPinImageURL.host,
      themeName,
    }
  } else {
    throw new Error('Unknown image storage host')
  }

  if (repoNameFromPinURL !== repoNameFromPinImageAltText)
    throw new Error(outdent`
      Repo name from pin image URL, doesn\'t match repository name from
      alt text to the pin image.
    `)

  if (repoURL.host !== 'github.com')
    throw new Error(`Repo URL isn't even on github.com`)

  const [usernameFromRepoURL, repoNameFromRepoURL] = repoURL.pathname
    .split('/')
    .filter(Boolean)

  if (!usernameFromRepoURL)
    throw new Error(`Repo URL doesn't have username in it`)

  if (!repoNameFromRepoURL)
    throw new Error(`Repo URL doesn't have repoName in it`)

  if (repoNameFromRepoURL !== repoNameFromPinURL)
    throw new Error(
      `Repo name from repo URL is not equal to repo name from pin image URL`,
    )

  if (usernameFromRepoURL !== usernameFromPinURL)
    throw new Error(
      `Username from repo URL is not equal to username from pin image URL`,
    )

  return {
    username: usernameFromPinURL,
    repoName: repoNameFromPinImageAltText,
    repoPinImageURL,
    repoURL,
    ...additionalContext,
  }
}
