const strengthSet = new Set(['s', 'm', 'v'])
const accordIndexSet = new Set([0, 1, 2, 3, 4, 5, 6, 7])
const patternIndexSet = new Set([0, 1, 2, 3, 4, 5, 6, 7])

function getCombinations<T>(size: number, array: T[]): T[][] {
  const results: T[][] = []

  const backtrack = (start: number, path: T[]) => {
    if (path.length === size) {
      results.push([...path])
      return
    }

    for (let i = start; i < array.length; i++) {
      path.push(array[i]!)
      backtrack(i + 1, path)
      path.pop()
    }
  }

  backtrack(0, [])
  return results
}

// uses Hamming graph and Hamming Distance
export const neighborFactory =
  <const Sets extends { setName: string; set: Set<any> }[] | []>(sets: Sets) =>
  (
    clicks: Range<Sets['length']>,
    startNode: GetNode<Sets>,
  ): GetNode<Sets>[] => {
    if (clicks === 0) return [startNode]

    if (clicks > 3) return []

    const reducedSets = sets.map(({ set, setName }) => {
      const reducedArr = []
      for (const param of set)
        if (param !== (startNode as any)[setName]) reducedArr.push(param)

      return { setName, reducedArr }
    })
    const results = []

    for (const setCombination of getCombinations(clicks, reducedSets)) {
      const totalAmountOfElements = setCombination.reduce(
        (acc, cur) => acc * cur.reducedArr.length,
        1,
      )

      for (
        let currentNeighborIndexOfAll = 0;
        currentNeighborIndexOfAll < totalAmountOfElements;
        currentNeighborIndexOfAll++
      ) {
        const currentCombination: Record<string, any> = { ...startNode }
        let temp = currentNeighborIndexOfAll

        for (
          let currentSetCombinationIndex = setCombination.length - 1;
          currentSetCombinationIndex >= 0;
          currentSetCombinationIndex--
        ) {
          const { reducedArr, setName } =
            setCombination[currentSetCombinationIndex]!
          const size = reducedArr.length

          currentCombination[setName] = reducedArr[temp % size]
          temp = Math.floor(temp / size)
        }
        results.push(currentCombination as GetNode<Sets>)
      }
    }
    return results
  }

export const getNeighborMIDIPadButtons = neighborFactory([
  { setName: 'patternIndex', set: patternIndexSet },
  { setName: 'strength', set: strengthSet },
  { setName: 'accordIndex', set: accordIndexSet },
])

type Range<
  N extends number,
  Acc extends number[] = [],
> = Acc['length'] extends N
  ? Acc[number] | N
  : Range<N, [...Acc, Acc['length']]>

type GetNode<Arg extends { setName: string; set: Set<any> }[]> = {
  [K in Arg[number] as K['setName']]: K['set'] extends Set<infer T> ? T : never
}
