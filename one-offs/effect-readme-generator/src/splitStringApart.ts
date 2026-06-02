export class TokenReplacer<
  const TokenPairs extends Record<
    string,
    readonly [leftToken: string, leftToken: string]
  >,
> {
  #_string: string
  config: TokenPairs

  constructor(string: string, config: TokenPairs) {
    this.#_string = string
    this.config = config
  }

  getPartsOnFirstMatch(tokenPairAlias: keyof TokenPairs) {
    return this.#_getPartsOnFirstMatch(tokenPairAlias, this.#_string)
  }

  getPartsOnFirstMatchOrThrow(tokenPairAlias: keyof TokenPairs) {
    const res = this.getPartsOnFirstMatch(tokenPairAlias)

    assertSuccess(res)

    return res.success
  }

  updatePartBetweenFirstMatchOfTokensAndGetNewStringOrThrow(
    tokenPairAlias: keyof TokenPairs,
    newPartBetweenTokens: string,
  ) {
    const res = this.updatePartBetweenFirstMatchOfTokensAndGetNewString(
      tokenPairAlias,
      newPartBetweenTokens,
    )

    assertSuccess(res)

    return res.success
  }

  updatePartBetweenFirstMatchOfTokensAndGetNewString(
    tokenPairAlias: keyof TokenPairs,
    newPartBetweenTokens: string,
  ) {
    const res = this.#_getNewStringWithUpdatedPartBetweenFirstMatchOfTokens(
      tokenPairAlias,
      newPartBetweenTokens,
      this.#_string,
    )

    if (isErr(res)) return res

    this.#_string = res.success

    return res
  }

  get string(): string {
    return this.#_string
  }

  #_getPartsOnFirstMatch(tokenPairAlias: keyof TokenPairs, string: string) {
    const [startToken, endToken] = this.config[tokenPairAlias]!
    const startingToken1stCharPos = string.indexOf(startToken)
    const endingToken1stCharPos = string.indexOf(endToken)

    if (startingToken1stCharPos === -1 && endingToken1stCharPos === -1)
      return { error: 'Both markers are missing' } as const

    if (startingToken1stCharPos === -1)
      return { error: 'START marker is missing' } as const

    if (endingToken1stCharPos === -1)
      return { error: 'END marker is missing' } as const

    if (startingToken1stCharPos > endingToken1stCharPos)
      return {
        error:
          'START marker appeared to be set after END marker. START marker should go first.',
      } as const

    return {
      success: {
        stringBeforeTargetPartIncludingStartToken: string.slice(
          0,
          startingToken1stCharPos + startToken.length,
        ),
        targetPartExcludingTokens: string.slice(
          startingToken1stCharPos + startToken.length,
          endingToken1stCharPos,
        ),
        stringAfterTargetPartIncludingEndToken: string.slice(
          endingToken1stCharPos,
        ),

        stringBeforeStartToken: string.slice(0, startingToken1stCharPos),
        partWrappedInTokens: string.slice(
          startingToken1stCharPos,
          endingToken1stCharPos + endToken.length,
        ),
        stringAfterEndToken: string.slice(
          endingToken1stCharPos + endToken.length,
        ),
      },
    }
  }

  #_getNewStringWithUpdatedPartBetweenFirstMatchOfTokens(
    tokenPairAlias: keyof TokenPairs,
    newPartBetweenTokens: string,
    string: string,
  ) {
    const res = this.#_getPartsOnFirstMatch(tokenPairAlias, string)

    if (isErr(res)) return res

    return {
      success:
        res.success.stringBeforeTargetPartIncludingStartToken +
        newPartBetweenTokens +
        res.success.stringAfterTargetPartIncludingEndToken,
    }
  }
}

function isErr<T>(t: T): t is Extract<T, { error: string }> {
  return (
    typeof t === 'object' &&
    t !== null &&
    'error' in t &&
    typeof t.error === 'string'
  )
}

function assertSuccess<T>(t: T): asserts t is Exclude<T, { error: string }> {
  if (isErr(t)) throw new Error(t.error)
}
