export function renderMarkdownTableOfSmallStrings(
  smallStrings: string[],
  columnsAmount: number,
) {
  if (smallStrings.some(s => s.includes('\n') || s.includes('\r')))
    throw new Error(
      'Strings passed to markdown table renderer cannot have newlines',
    )

  const mapOfRowIndexToStringGroup = Object.groupBy(smallStrings, (_, i) =>
    Math.floor(i / columnsAmount),
  )

  const allStringGroups = Object.values(
    mapOfRowIndexToStringGroup,
  ) as string[][]

  const _ = allStringGroups.map(stringGroup =>
    renderRow(stringGroup, columnsAmount),
  )

  const [renderedRowsExceptFirst, firstRowRendered] = [
    _,
    _.shift() || [],
  ] as const

  return [
    ,
    firstRowRendered,
    '|' + '-|'.repeat(columnsAmount),
    ...renderedRowsExceptFirst,
    ,
  ].join('\n')
}

function renderRow(stringGroup: string[], columnsAmount: number) {
  return Array.from(
    /* `columnsAmount` maintains amount of columns in cases when the group is half-full */
    /* `+2` adds | to the sides */
    { length: columnsAmount + 2 },
    (_, i) => stringGroup[i - 1] || '',
  ).join('|')
}
