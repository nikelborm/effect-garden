import { varchar } from 'drizzle-orm/pg-core'

import { flow } from 'effect/Function'

import { addColumn } from './addColumn.ts'
import { addRequiredColumn } from './addRequiredColumn.ts'

export const addRequiredName = addRequiredColumn('name', varchar)
export const addOptionalDescription = addColumn('description', varchar)

export const addRequiredNameWithOptionalDescription = flow(
  addRequiredName,
  addOptionalDescription,
)
