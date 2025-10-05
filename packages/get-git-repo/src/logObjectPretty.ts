import { dir } from 'effect/Console';
import { type Effect, tap, tapError } from 'effect/Effect';
import { flow } from 'effect/Function';

export const LogObjectPretty = (item: unknown) =>
  dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });

export const LogSuccessObjectPretty = <A, E, R>(self: Effect<A, E, R>) =>
  tap(self, LogObjectPretty);

export const LogErrorObjectPretty = <A, E, R>(self: Effect<A, E, R>) =>
  tapError(self, LogObjectPretty);

export const TapLogBoth = flow(LogSuccessObjectPretty, LogErrorObjectPretty);

export const logObjectPretty = (item: unknown) =>
  console.dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });
