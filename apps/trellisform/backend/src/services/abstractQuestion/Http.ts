import { HttpApiBuilder, HttpServerResponse } from '@effect/platform';
import { API } from '@trellisform/api';
import { abstractAnswerOption, abstractQuestion } from '@trellisform/database/schema';
import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { Database } from '../infrastructure/Database.ts';
import { UserWithSession } from '@trellisform/api/auth.ts';
import { ensureReturningOneId } from '@evadev/effect-helpers';

export const AbstractQuestionHttpGroupLive = HttpApiBuilder.group(
  API,
  'Abstract question',
  Effect.fn(function* (handlers) {
    const db = yield* Database;
    return handlers
      .handle(
        'Create abstract answer option',
        Effect.fn('Create abstract answer option handler')(function* ({
          path: { abstractQuestionId },
        }) {
          const {
            user: { id: userId },
          } = yield* UserWithSession;

          return yield* db
            .insert(abstractAnswerOption)
            .values({
              createdByUserId: userId,
              abstractQuestionId,
            })
            .returning({ id: abstractAnswerOption.id })
            .pipe(ensureReturningOneId('AbstractAnswerOption'), Effect.orDie);
        }),
      )
      .handle(
        'Delete abstract question',
        Effect.fn('Delete abstract question handler')(function* ({
          path: { abstractQuestionId },
        }) {
          yield* Effect.annotateCurrentSpan(
            'abstract question id',
            abstractQuestionId,
          );

          yield* db
            .delete(abstractQuestion)
            .where(eq(abstractQuestion.id, abstractQuestionId))
            .pipe(Effect.orDie);
        }),
      );
  }),
);
