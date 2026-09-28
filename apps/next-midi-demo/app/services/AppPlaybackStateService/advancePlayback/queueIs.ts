import * as Schema from 'effect/Schema'

// Narrows a playback state on the shape of its `transitionQueue`, so a dispatcher
// can hand the WHOLE oldState (already typed to one queue scenario) to the small
// advancer that owns it, instead of unpacking the queue elements itself.
export const queueIs =
  <A extends readonly unknown[]>(queueSchema: Schema.Schema<A>) =>
  <S extends { readonly transitionQueue: unknown }>(
    state: S,
  ): state is S & { readonly transitionQueue: A } =>
    Schema.is(queueSchema)(state.transitionQueue)
