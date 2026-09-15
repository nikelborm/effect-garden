import * as Atom from 'effect/unstable/reactivity/Atom'

import { AllAccords } from '../domain/Accord.ts'

const runtime = Atom.runtime(AllAccords.Default)

export const accordsAtom = runtime.atom(AllAccords)
