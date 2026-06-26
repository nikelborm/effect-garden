import * as Atom from '@effect-atom/atom/Atom'

import { AllStrengths } from '../domain/Strength.ts'

const runtime = Atom.runtime(AllStrengths.Default)

export const strengthsAtom = runtime.atom(AllStrengths)
