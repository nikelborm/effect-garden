export const parseInt10 = (a: unknown) => parseInt(a as string, 10)

export const parseInt10OrNull = (a: unknown) => {
  const res = parseInt10(a)
  if (Number.isNaN(res)) return null
  return res
}
