import * as Equal from 'effect/Equal'
import * as Hash from 'effect/Hash'

import type { TaggedReadonlyObject } from './TaggedReadonlyObject.ts'

export const isData = (idData: TaggedReadonlyObject) =>
  typeof idData === 'object' &&
  idData !== null &&
  '_tag' in idData &&
  // biome-ignore lint/complexity/useLiteralKeys: fuck you, biome. when the fuck will you start being compatible with typescript??
  typeof idData['_tag'] === 'string' &&
  // biome-ignore lint/complexity/useLiteralKeys: fuck you, biome. when the fuck will you start being compatible with typescript??
  idData['_tag'] !== '' &&
  Hash.symbol in idData &&
  Equal.symbol in idData
