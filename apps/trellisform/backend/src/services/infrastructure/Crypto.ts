import { Effect } from 'effect'

export class Crypto extends Effect.Service<Crypto>()('Crypto', {
  effect: Effect.gen(function* () {
    return {}
  }),
}) {}
