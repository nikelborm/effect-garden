import { all, type Effect } from 'effect/Effect';
import type { Concurrency, NoExcessProperties } from 'effect/Types';

export const allWithInheritedConcurrencyByDefault = <
  const Arg extends
    | Iterable<Effect<any, any, any>>
    | Record<string, Effect<any, any, any>>,
  O extends NoExcessProperties<
    {
      readonly concurrency?: Concurrency | undefined;
      readonly batching?: boolean | 'inherit' | undefined;
      readonly discard?: boolean | undefined;
      readonly mode?: 'default' | 'validate' | 'either' | undefined;
      readonly concurrentFinalizers?: boolean | undefined;
    },
    O
  >,
>(
  arg: Arg,
  options?: O,
) =>
  all(arg, {
    concurrency: 'inherit',
    ...options,
  });
