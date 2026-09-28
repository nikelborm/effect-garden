import * as Atom from 'effect/reactivity/Atom'

import { AllStrengths } from '../domain/Strength.ts'

const runtime = Atom.runtime(AllStrengths.Default)

export const strengthsAtom = runtime.atom(AllStrengths)
