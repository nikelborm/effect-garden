import { HttpApi, HttpLayerRouter } from '@effect/platform'
import * as Etag from '@effect/platform/Etag'
import { Layer } from 'effect'

import { AbstractAnswerOptionApiGroup } from './src/abstractAnswerOption.api.ts'
import { AbstractQuestionApiGroup } from './src/abstractQuestion.api.ts'
import { AbstractTestApiGroup } from './src/abstractTest.api.ts'
import { AbstractTestStageApiGroup } from './src/abstractTestStage.api.ts'
import { AbstractTestVariantApiGroup } from './src/abstractTestVariant.api.ts'
import { AuthApiGroup, UserWithSessionMiddleware } from './src/auth.api.ts'
import { EducationalSpaceApiGroup } from './src/educationalSpace.api.ts'
import { TestVariantAttemptApiGroup } from './src/testVariantAttempt.api.ts'
// import { HealthApiGroup } from './src/health.api.ts';

export const API = HttpApi.make('api')
  // .add(HealthApiGroup.prefix('/health'))
  .add(AbstractQuestionApiGroup.prefix('/abstractQuestion'))
  .add(AbstractAnswerOptionApiGroup.prefix('/abstractAnswerOption'))
  .add(AbstractTestApiGroup.prefix('/abstractTest'))
  .add(AbstractTestStageApiGroup.prefix('/abstractTestStage'))
  .add(AbstractTestVariantApiGroup.prefix('/abstractTestVariant'))
  .add(EducationalSpaceApiGroup.prefix('/educationalSpace'))
  .add(TestVariantAttemptApiGroup.prefix('/testVariantAttempt'))
  .middleware(UserWithSessionMiddleware)
  .add(AuthApiGroup.prefix('/auth'))
  .prefix('/api')

const HttpApiRoutes = HttpLayerRouter.addHttpApi(API, {
  // openapiPath: '/docs/openapi.json',
}).pipe(
  // Provide the api handlers layer
  // Layer.provide(UsersApiLayer),
  Layer.provide(Etag.layerWeak),
)

// GET("/my_answers/")
// POST("/create_test_manually/")
// GET("/get_draft_test/{test_id}")
// GET("/get_test/{test_id}")
// GET("/get_test_meta/{test_id}")
// GET("/get_user_tests")
// POST("/generate_math_question/")
// POST("/generate_question_from_text/")
// POST('/get_correct_answers_amount/{testId}')
// DELETE("/delete_answer/{answer_id}")
// POST("/set_correct_answer/{answer_id}")
// DELETE("/delete_problem/{problem_id}")
// POST("/add_answer/{problem_id}")
// PUT("/update_answer_content/{answer_id}")
// PUT("/update_question/{problem_id}")
// POST("/create_problem/{test_id}")
