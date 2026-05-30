import { accordIndexSet } from '../brandsAndDatas/Accord.ts';
import { patternIndexSomeSet } from '../brandsAndDatas/Pattern.ts';
import { strengthSet } from '../brandsAndDatas/Strength.ts';
import { neighborFactory } from './neighborFactory.ts'

export const getNeighborMIDIPadButtons = neighborFactory([
  { setName: 'patternIndex', set: patternIndexSomeSet },
  { setName: 'strength', set: strengthSet },
  { setName: 'accordIndex', set: accordIndexSet },
])
