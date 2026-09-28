import * as Atom from 'effect/reactivity/Atom'

import { AllAccords } from '../domain/Accord.ts'

const runtime = Atom.runtime(AllAccords.Default)

export const accordsAtom = runtime.atom(AllAccords)
