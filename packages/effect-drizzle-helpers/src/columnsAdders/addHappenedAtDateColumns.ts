import { timestamp } from 'drizzle-orm/pg-core'

import { flow } from 'effect/Function'

import { addColumn } from './addColumn.ts'

const addHappenedAtDateColumn = <const TColumnName extends string>(
  name: TColumnName,
) =>
  addColumn(name, () =>
    timestamp({
      withTimezone: true,
      mode: 'string',
    })
      .defaultNow()
      .notNull(),
  )

export const addCreatedAtDateColumn = addHappenedAtDateColumn('createdAt')

export const addCreatedAndUpdatedDateColumns = flow(
  addCreatedAtDateColumn,
  addHappenedAtDateColumn('updatedAt'),
)
