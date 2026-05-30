import { accordSet } from '../brandsAndDatas/Accord.ts'
import { patternSomeSet } from '../brandsAndDatas/Pattern.ts'
import { strengthSet } from '../brandsAndDatas/Strength.ts'
import { neighborFactory } from './neighborFactory.ts'

export const getNeighborMIDIPadButtons = neighborFactory([
  { setName: 'pattern', set: patternSomeSet },
  { setName: 'strength', set: strengthSet },
  { setName: 'accord', set: accordSet },
])
