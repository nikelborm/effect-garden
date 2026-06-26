import * as Atom from '@effect-atom/atom/Atom'

import { AllPatterns } from '../domain/Pattern.ts'

const runtime = Atom.runtime(AllPatterns.Default)

export const patternsAtom = runtime.atom(AllPatterns)
