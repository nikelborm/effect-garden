import * as Atom from 'effect/reactivity/Atom'

import { AllPatterns, AllPatternsLayer } from '../domain/Pattern.ts'

const runtime = Atom.runtime(AllPatternsLayer)

export const patternsAtom = runtime.atom(AllPatterns)
