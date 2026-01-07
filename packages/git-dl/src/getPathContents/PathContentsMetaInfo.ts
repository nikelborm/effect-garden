import { gen, succeed } from 'effect/Effect'

import { CastToReadableStream } from '../castToReadableStream.ts'
import { ParsedMetaInfoAboutPathContentsFromGitHubAPI } from './ParsedMetaInfoAboutPathContentsFromGitHubAPI.ts'
import { parseGitLFSObjectEither } from './parseGitLFSObjectEither.ts'

export const PathContentsMetaInfo = gen(function* () {
  const response = yield* ParsedMetaInfoAboutPathContentsFromGitHubAPI

  const { type, name, path, size } = response

  if (type === 'dir') {
    const { entries, sha: treeSha } = response

    if (name && path)
      return {
        type,
        name,
        path,
        treeSha,
        entries,
        meta: 'This nested directory can be downloaded as a git tree',
      } as const

    return {
      type,
      treeSha,
      entries,
      meta: 'This root directory of the repo can be downloaded as a git tree',
    } as const
  }

  // This is quite forgiving implementation. I had the choice to throw
  // errors whenever GitHub's API didn't follow its documentation. I even
  // did that initially, but when I looked at the resulting mess, I changed
  // my mind not to. For example, I could throw errors in the following
  // cases:

  // 1. When the size is between 1 MB and 100 MB per documentation, I
  //    should never receive data. Instead, I should receive an empty
  //    "content" field and an "encoding" field equal to "none." If this
  //    promise was broken, I could have thrown an error. Instead, if I
  //    receive a 50 MB file with the correct encoding, I will parse and
  //    return it.
  // 2. Per the documentation, all files larger than 100 MB should be put
  //    into Git LFS storage. If I receive a 110 MB file inlined, I'll not
  //    fail; I'll parse and return it.
  // 3. Per documentation when size less than 1MB it MUST be inlined. If it
  //    wasn't inlined I could have thrown an error, but instead, I just
  //    returned an object representing the message "It's a blob, download
  //    it elsewhere"
  // 4. Per documentation files larger than 100 mb must be in a git LFS
  //    storage and it's assumed that git LFS annotation will be provided.
  //    But if it's not provided, instead of throwing an error, I returned
  //    an object representing the message "It's a blob, download it
  //    elsewhere"

  // In the end it leads to much lower complexity with a ton of IFs removed

  const { content, encoding, sha: blobSha, ..._ } = response
  const base = { ..._, blobSha }

  if (encoding === 'none')
    return {
      ...base,
      meta: 'This file can be downloaded as a blob',
    } as const

  const contentAsBuffer = Buffer.from(content, encoding)

  const potentialGitLFSObject = yield* parseGitLFSObjectEither({
    contentAsBuffer,
    expectedContentSize: size,
  })

  if (typeof potentialGitLFSObject === 'object')
    return {
      ...base,
      ...potentialGitLFSObject,
      meta: 'This file can be downloaded as a git-LFS object',
    } as const

  return {
    ...base,
    contentStream: CastToReadableStream(succeed(contentAsBuffer)),
    meta: 'This file is small enough that GitHub API decided to inline it',
  } as const
})
