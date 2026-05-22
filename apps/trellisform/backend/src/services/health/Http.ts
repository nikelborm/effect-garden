// import { HttpApiBuilder, HttpServerResponse } from '@effect/platform';
// import { Effect } from 'effect';
// import { API } from '@trellisform/api';

// export const HealthHttpGroupLive = HttpApiBuilder.group(
//   API,
//   'Health',
//   Effect.fn(function* (handlers) {
//     return handlers.handle(
//       'Get current health',
//       Effect.fn('HealthGroupHttpLive handler')(function* () {
//         yield* Effect.sleep('2 seconds');

//         return yield* HttpServerResponse.text('ok');
//       }),
//     );
//   }),
// );
