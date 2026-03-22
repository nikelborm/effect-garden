import type { NoteIdData } from '../branded/MIDIValues.ts'
import type { ValidKeyboardKeyData } from '../branded/StoreValues.ts'
import type { AccordIndexData } from './AccordRegistry.ts'
import type { PatternIndexData } from './PatternRegistry.ts'
import type { StrengthData } from './StrengthRegistry.ts'

export type SupportedKeyData =
  | ValidKeyboardKeyData
  | NoteIdData
  | AccordIndexData
  | StrengthData
  | PatternIndexData
