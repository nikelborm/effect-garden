import * as Atom from '@effect-atom/atom/Atom'

import { StrengthRegistry } from '../services/StrengthRegistry.ts'

const runtime = Atom.runtime(StrengthRegistry.Default)

export const strengthsAtom = runtime.atom(StrengthRegistry.allStrengths)
