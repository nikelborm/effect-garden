import { neighborFactory } from './neighborFactory.ts'

const strengthSet = new Set(['s', 'm', 'v'] as const)
const accordIndexSet = new Set([0, 1, 2, 3, 4, 5, 6, 7] as const)
const patternIndexSet = new Set([0, 1, 2, 3, 4, 5, 6, 7] as const)

export const getNeighborMIDIPadButtons = neighborFactory([
  { setName: 'patternIndex', set: patternIndexSet },
  { setName: 'strength', set: strengthSet },
  { setName: 'accordIndex', set: accordIndexSet },
])
