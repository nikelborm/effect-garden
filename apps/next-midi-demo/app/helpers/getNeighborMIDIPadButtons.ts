import { chordSet } from '../domain/Chord.ts'
import { patternSomeSet } from '../domain/Pattern.ts'
import { strengthSet } from '../domain/Strength.ts'
import { neighborFactory } from './neighborFactory.ts'

export const getNeighborMIDIPadButtons = neighborFactory([
  { setName: 'pattern', set: patternSomeSet },
  { setName: 'strength', set: strengthSet },
  { setName: 'chord', set: chordSet },
])
