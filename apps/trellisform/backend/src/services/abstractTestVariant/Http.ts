import { HttpApiBuilder, HttpServerResponse } from '@effect/platform';
import { Console, Effect, Struct } from 'effect';
import { API } from '@trellisform/api';
import { Database } from '../infrastructure/Database.ts';
import { UserWithSession } from '@trellisform/api/auth.ts';
import {
  abstractQuestion,
  abstractTest,
  abstractTestStage,
  abstractTestVariant,
} from '@trellisform/database/schema';

export const AbstractTestVariantHttpGroupLive = HttpApiBuilder.group(
  API,
  'Abstract test variant',
  Effect.fn(function* (handlers) {
    const db = yield* Database;
    return handlers

      .handle(
        'Create test variant manually',
        Effect.fn('Create test variant manually handler')(function* ({
          payload,
        }) {
          const {
            user: { id: userId },
          } = yield* UserWithSession;

          yield* db.insert(abstractTestVariant).values({
            ...Struct.omit(payload, '_tag'),
            createdByUserId: userId,
          });

          return yield* HttpServerResponse.text('ok');
        }),
      )
      .handle(
        'Create test variant with AI',
        Effect.fn('Create test variant with AI handler')(function* ({}) {
          yield* Effect.sleep('2 seconds');

          return yield* HttpServerResponse.text('ok');
        }),
      )
      .handle(
        'Get test variant',
        Effect.fn('Get test variant handler')(function* ({
          path: { abstractTestVariantId },
        }) {
          const asd = yield* UserWithSession;
          yield* Console.log(asd);

          yield* Effect.annotateCurrentSpan(
            'abstract test variant id',
            abstractTestVariantId,
          );
          yield* Effect.sleep('2 seconds');

          return yield* HttpServerResponse.text('ok');
        }),
      )
      .handle(
        'Create test stage',
        Effect.fn('Create abstract question handler')(function* ({
          path: { abstractTestVariantId },
        }) {
          const {
            user: { id: userId },
          } = yield* UserWithSession;

          yield* Effect.annotateCurrentSpan(
            'abstract test variant id',
            abstractTestVariantId,
          );

          yield* db
            .insert(abstractTestStage)
            .values({
              createdByUserId: userId,
              abstractTestVariantId,
              name: 'Default',
            })
            .pipe(Effect.orDie);

          return yield* HttpServerResponse.text('ok');
        }),
      )
      .handle(
        'Create test variant attempt',
        Effect.fn('Create test variant attempt handler')(function* ({
          path: { abstractTestVariantId },
        }) {
          const asd = yield* UserWithSession;
          yield* Console.log(asd);

          yield* Effect.annotateCurrentSpan(
            'abstract test variant id',
            abstractTestVariantId,
          );
          yield* Effect.sleep('2 seconds');

          return yield* HttpServerResponse.text('ok');
        }),
      );
  }),
);
