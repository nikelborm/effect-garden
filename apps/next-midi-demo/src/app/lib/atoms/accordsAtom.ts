import * as Atom from '@effect-atom/atom/Atom'

import { AccordRegistry } from '../services/AccordRegistry.ts'

const runtime = Atom.runtime(AccordRegistry.Default)

export const accordsAtom = runtime.atom(AccordRegistry.allAccords)

export const setActiveAccordAtom = runtime.fn(AccordRegistry.selectAccord)
