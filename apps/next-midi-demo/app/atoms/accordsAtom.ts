import * as Atom from '@effect-atom/atom/Atom'

import { AllAccords } from '../domain/Accord.ts'

const runtime = Atom.runtime(AllAccords.Default)

export const accordsAtom = runtime.atom(AllAccords)
