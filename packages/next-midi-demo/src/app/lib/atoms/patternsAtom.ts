import * as Atom from '@effect-atom/atom/Atom'

import { PatternRegistry } from '../services/PatternRegistry.ts'

const runtime = Atom.runtime(PatternRegistry.Default)

export const patternsAtom = runtime.atom(PatternRegistry.allPatterns)

export const setActivePatternAtom = runtime.fn(PatternRegistry.selectPattern)
