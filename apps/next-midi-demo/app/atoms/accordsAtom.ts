import * as Atom from 'effect/reactivity/Atom'

import { AllAccords, AllAccordsLayer } from '../domain/Accord.ts'

const runtime = Atom.runtime(AllAccordsLayer)

export const accordsAtom = runtime.atom(AllAccords)
