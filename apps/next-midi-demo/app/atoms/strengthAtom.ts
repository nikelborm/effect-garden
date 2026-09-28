import * as Atom from 'effect/reactivity/Atom'

import { AllStrengths, AllStrengthsLayer } from '../domain/Strength.ts'

const runtime = Atom.runtime(AllStrengthsLayer)

export const strengthsAtom = runtime.atom(AllStrengths)
