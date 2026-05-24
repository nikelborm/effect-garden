import { DbConfig } from '@evadev/backend-config'
import { schemaWithRelations } from '@trellisform/database'

import * as PgDrizzlePg from '@effect/sql-drizzle/Pg'
import * as PgClient from '@effect/sql-pg/PgClient'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as EString from 'effect/String'

export const SqlLive = Layer.unwrapEffect(
  DbConfig.use(({ db }) =>
    PgClient.layer({
      ...db,
      transformQueryNames: EString.camelToSnake,
      transformResultNames: EString.snakeToCamel,
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
