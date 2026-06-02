export async function* racinglyIterateAll<
  U extends Array<Promise<unknown>> | [Promise<unknown>],
>(promises: U, failLate?: boolean) {
  const mapOfIndexesToNotYetYieldedRacers = new Map(
    promises.map((promise, index) => [
      index,
      (async () => {
        try {
          return {
            index,
            status: 'ok' as const,
            result: (await promise) as Awaited<U[number]>,
          }
        } catch (error) {
          return {
            index,
            status: 'error' as const,
            error,
          }
        }
      })(),
    ]),
  )

  const errors: RacingIterationError[] = []

  while (mapOfIndexesToNotYetYieldedRacers.size > 0) {
    // remember that Promise.race may hang if given empty iterator. In
    // current condition we already checking for that with `while` cycle
    // condition
    const racer = await Promise.race(mapOfIndexesToNotYetYieldedRacers.values())

    if (racer.status === 'error') {
      const racingIterationError = new RacingIterationError(
        racer.index,
        racer.error,
      )
      if (failLate) {
        errors.push(racingIterationError)
      } else {
        // TODO: call signal.abort() for each mapOfIndexesToNotYetYieldedRacers
        throw racingIterationError
      }
    } else {
      mapOfIndexesToNotYetYieldedRacers.delete(racer.index)
      yield {
        index: racer.index,
        result: racer.result,
      }
    }
  }

  if (errors.length === 1) throw errors[0]
  if (errors.length > 1) throw new RacingIterationAggregateError(errors)
}

class RacingIterationAggregateError extends AggregateError {
  override errors: RacingIterationError[]
  constructor(errors: RacingIterationError[]) {
    super(errors, 'Few of the racing promises failed')
    this.errors = errors
  }
}

export class RacingIterationError extends Error {
  public readonly promiseIndex: number
  public override readonly cause: unknown

  constructor(promiseIndex: number, cause: unknown) {
    super('One of the racing promises failed')
    this.promiseIndex = promiseIndex
    this.cause = cause
  }
}
