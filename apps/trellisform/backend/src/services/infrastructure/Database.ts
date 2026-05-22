import { DbConfig } from '@evadev/backend-config'
import { schemaWithRelations } from '@trellisform/database'

import * as PgDrizzlePg from '@effect/sql-drizzle/Pg'
import * as SqlPg from '@effect/sql-pg'
import { Effect, Layer, String as Str } from 'effect'

export const SqlLive = Layer.unwrapEffect(
  DbConfig.use(({ db }) =>
    SqlPg.PgClient.layer({
      ...db,
      transformQueryNames: Str.camelToSnake,
      transformResultNames: Str.snakeToCamel,
    }),
  ),
)

export class Database extends Effect.Service<Database>()(
  '@trellisform/EffectfulDrizzle',
  {
    effect: PgDrizzlePg.make({
      schema: schemaWithRelations,
      casing: 'snake_case',
    }),
  },
) {
  static Client = Layer.provideMerge(this.Default, SqlLive)
}
