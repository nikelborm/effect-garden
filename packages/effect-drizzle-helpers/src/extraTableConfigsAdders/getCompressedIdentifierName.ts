export function getCompressedIdentifierName(prefix: string, tokens: string[]) {
  {
    const wide = prefix + '_' + tokens.join('_')
    if (wide.length <= 63) return wide
  }
  tokens = tokens.flatMap(e => e.split('_')).filter(Boolean)
  const render = () =>
    prefix + '_' + tokens.map(e => e[0]?.toUpperCase() + e.slice(1)).join('')
  let rendered = render()

  while (rendered.length > 63) {
    const maxLength = Math.max(...tokens.map(e => e.length))
    if (maxLength === 1) {
      rendered = rendered.slice(0, 63)
      break
    }
    const index = tokens.findLastIndex(e => e.length === maxLength)
    if (index in tokens) tokens[index] = tokens[index]!.slice(0, 1)
    else throw new Error('wtf in getCompressedIdentifierName')
    rendered = render()
  }

  return rendered
}
