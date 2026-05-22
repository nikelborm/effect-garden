import { HttpApiBuilder, HttpServerResponse } from '@effect/platform';
import { API } from '@trellisform/api';
import { Effect } from 'effect';
import { Database } from '../infrastructure/Database.ts';
import { abstractAnswerOption } from '@trellisform/database/schema';
import { eq } from 'drizzle-orm';

export const AbstractAnswerOptionHttpGroupLive = HttpApiBuilder.group(
  API,
  'Abstract answer option',
  Effect.fn(function* (handlers) {
    const db = yield* Database;
    return handlers.handle(
      'Delete abstract answer option',
      Effect.fn('Delete abstract answer option handler')(function* ({
        path: { abstractAnswerOptionId },
      }) {
        yield* Effect.annotateCurrentSpan(
          'abstract answer option id',
          abstractAnswerOptionId,
        );

        yield* db
          .delete(abstractAnswerOption)
          .where(eq(abstractAnswerOption.id, abstractAnswerOptionId))
          .pipe(Effect.orDie);
      }),
    );
  }),
);
