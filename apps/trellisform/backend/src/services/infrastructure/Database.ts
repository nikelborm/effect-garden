import { DbConfig } from '@evadev/backend-config'
import { schemaWithRelations } from '@trellisform/database'

import * as PgDrizzlePg from '@effect/sql-drizzle/Pg'
import * as PgClient from '@effect/sql-pg/PgClient'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'
import * as EString from 'effect/String'

export const SqlLive = Layer.unwrap(
  DbConfig.use(({ db }) =>
    PgClient.layer({
      ...db,
      transformQueryNames: EString.camelToSnake,
      transformResultNames: EString.snakeToCamel,
    }),
  ),
)

export class Database extends Context.Service<Database>()(
  '@trellisform/EffectfulDrizzle',
  {
    make: PgDrizzlePg.make({
      schema: schemaWithRelations,
      casing: 'snake_case',
    }),
  },
) {
  static Client = Layer.provideMerge(this.Default, SqlLive)
}
