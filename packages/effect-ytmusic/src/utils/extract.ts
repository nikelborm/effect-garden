export const extract = (data: any, ...keys: string[]) => {
  const again = (data: any, key: string, deadEnd = false): any => {
    const res = []

    if (data instanceof Object && key in data) {
      res.push(data[key])
      if (deadEnd) return res.length === 1 ? res[0] : res
    }

    if (Array.isArray(data)) {
      res.push(...data.flatMap(v => again(v, key)))
    } else if (data instanceof Object) {
      res.push(...Object.keys(data).flatMap(k => again(data[k], key)))
    }

    return res.length === 1 ? res[0] : res
  }

  let value = data
  const lastKey = keys.at(-1)
  for (const key of keys) {
    value = again(value, key, lastKey === key)
  }

  return value
}

export const extractList = (data: any, ...keys: string[]): any[] => {
  return [extract(data, ...keys)].flat()
}

export const extractString = (data: any, ...keys: string[]): string => {
  return extractList(data, ...keys).at(0) || ''
}
