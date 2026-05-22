import { relations } from 'drizzle-orm/relations'

import {
  abstractAnswerOption,
  abstractQuestion,
  abstractTest,
  abstractTestStage,
  abstractTestVariant,
  answerOptionInstance,
  availableForLaunchTest,
  educationalSpace,
  educationalSpaceAccessScope,
  launchedTest,
  launchedTestAccessScope,
  launchedTestVariant,
  launchedTestVariantAccessScope,
  questionInstance,
  singleCorrectAbstractAnswerOption,
  testStageInstance,
  testVariantAttempt,
  user,
  userGroup,
  userGroupManagementAccessScope,
  userToUserGroup,
} from './schema.ts'

export const userRelations = relations(user, ({ many }) => ({
  createdAbstractTests: many(abstractTest),
  createdAbstractTestVariants: many(abstractTestVariant),
  createdAbstractTestStages: many(abstractTestStage),
  createdAbstractTestQuestions: many(abstractQuestion),
  createdAbstractAnswerOptions: many(abstractAnswerOption),

  launchedTests: many(launchedTest),

  attemptedTestVariants: many(testVariantAttempt),

  createdEducationalSpaces: many(educationalSpace),
  createdUserGroups: many(userGroup),
  isInUserGroupsM2M: many(userToUserGroup),
}))

export const abstractTestRelations = relations(
  abstractTest,
  ({ one, many }) => ({
    createdBy: one(user, {
      fields: [abstractTest.createdByUserId],
      references: [user.id],
    }),

    abstractTestVariants: many(abstractTestVariant),
    availableForLaunchInEducationalSpacesM2M: many(availableForLaunchTest),
    launchedTests: many(launchedTest),
    launchedTestVariants: many(launchedTestVariant),
    // analyticsModulesM2M: many(testAnalyticsModuleToAbstractTest),
  }),
)

export const abstractTestVariantRelations = relations(
  abstractTestVariant,
  ({ one, many }) => ({
    createdBy: one(user, {
      fields: [abstractTestVariant.createdByUserId],
      references: [user.id],
    }),
    abstractTest: one(abstractTest, {
      fields: [abstractTestVariant.abstractTestId],
      references: [abstractTest.id],
    }),

    stages: many(abstractTestStage),
    launchedTestVariants: many(launchedTestVariant),
    testVariantAttempts: many(testVariantAttempt),
    testStageInstances: many(testStageInstance),
  }),
)

export const abstractTestStageRelations = relations(
  abstractTestStage,
  ({ one, many }) => ({
    createdBy: one(user, {
      fields: [abstractTestStage.createdByUserId],
      references: [user.id],
    }),
    abstractTestVariant: one(abstractTestVariant, {
      fields: [abstractTestStage.abstractTestVariantId],
      references: [abstractTestVariant.id],
    }),

    questions: many(abstractQuestion),
    instances: many(testStageInstance),
    questionInstances: many(questionInstance),
  }),
)

export const abstractQuestionRelations = relations(
  abstractQuestion,
  ({ one, many }) => ({
    createdBy: one(user, {
      fields: [abstractQuestion.createdByUserId],
      references: [user.id],
    }),
    abstractTestStage: one(abstractTestStage, {
      fields: [abstractQuestion.abstractTestStageId],
      references: [abstractTestStage.id],
    }),

    correctAnswerOption: one(singleCorrectAbstractAnswerOption),
    answerOptions: many(abstractAnswerOption),
    instances: many(questionInstance),
    answerOptionInstances: many(answerOptionInstance),
  }),
)

export const abstractAnswerOptionRelations = relations(
  abstractAnswerOption,
  ({ one, many }) => ({
    createdBy: one(user, {
      fields: [abstractAnswerOption.createdByUserId],
      references: [user.id],
    }),
    abstractQuestion: one(abstractQuestion, {
      fields: [abstractAnswerOption.abstractQuestionId],
      references: [abstractQuestion.id],
    }),

    correctResultOfQuestion: one(singleCorrectAbstractAnswerOption),
    instances: many(answerOptionInstance),
    // contributionsM2M: many(answerOptionIntoTagContribution),
  }),
)

export const singleCorrectAbstractAnswerOptionRelations = relations(
  singleCorrectAbstractAnswerOption,
  ({ one }) => ({
    abstractQuestion: one(abstractQuestion, {
      fields: [singleCorrectAbstractAnswerOption.abstractQuestionId],
      references: [abstractQuestion.id],
    }),
    abstractAnswerOption: one(abstractAnswerOption, {
      fields: [singleCorrectAbstractAnswerOption.abstractAnswerOptionId],
      references: [abstractAnswerOption.id],
    }),
  }),
)

export const availableForLaunchTestRelations = relations(
  availableForLaunchTest,
  ({ one }) => ({
    abstractTest: one(abstractTest, {
      fields: [availableForLaunchTest.abstractTestId],
      references: [abstractTest.id],
    }),
    educationalSpace: one(educationalSpace, {
      fields: [availableForLaunchTest.educationalSpaceId],
      references: [educationalSpace.id],
    }),
  }),
)

export const launchedTestRelations = relations(
  launchedTest,
  ({ one, many }) => ({
    abstractTest: one(abstractTest, {
      fields: [launchedTest.abstractTestId],
      references: [abstractTest.id],
    }),
    educationalSpace: one(educationalSpace, {
      fields: [launchedTest.educationalSpaceId],
      references: [educationalSpace.id],
    }),
    launchedBy: one(user, {
      fields: [launchedTest.launchedByUserId],
      references: [user.id],
    }),

    launchedVariants: many(launchedTestVariant),
    accessScopes: many(launchedTestAccessScope),
  }),
)

export const launchedTestVariantRelations = relations(
  launchedTestVariant,
  ({ one, many }) => ({
    abstractTest: one(abstractTest, {
      fields: [launchedTestVariant.abstractTestId],
      references: [abstractTest.id],
    }),
    abstractTestVariant: one(abstractTestVariant, {
      fields: [launchedTestVariant.abstractTestVariantId],
      references: [abstractTestVariant.id],
    }),
    launchedTest: one(launchedTest, {
      fields: [launchedTestVariant.launchedTestId],
      references: [launchedTest.id],
    }),

    attempts: many(testVariantAttempt),
    accessScopes: many(launchedTestVariantAccessScope),
  }),
)

export const testVariantAttemptRelations = relations(
  testVariantAttempt,
  ({ one, many }) => ({
    user: one(user, {
      fields: [testVariantAttempt.userId],
      references: [user.id],
    }),
    abstractTestVariant: one(abstractTestVariant, {
      fields: [testVariantAttempt.abstractTestVariantId],
      references: [abstractTestVariant.id],
    }),
    launchedTestVariant: one(launchedTestVariant, {
      fields: [testVariantAttempt.launchedTestVariantId],
      references: [launchedTestVariant.id],
    }),

    testStageInstances: many(testStageInstance),
  }),
)

export const testStageInstanceRelations = relations(
  testStageInstance,
  ({ many, one }) => ({
    abstractTestVariant: one(abstractTestVariant, {
      fields: [testStageInstance.abstractTestVariantId],
      references: [abstractTestVariant.id],
    }),
    testVariantAttempt: one(testVariantAttempt, {
      fields: [testStageInstance.testVariantAttemptId],
      references: [testVariantAttempt.id],
    }),
    abstractTestStage: one(abstractTestStage, {
      fields: [testStageInstance.abstractTestStageId],
      references: [abstractTestStage.id],
    }),

    questionInstances: many(questionInstance),
  }),
)

export const questionInstanceRelations = relations(
  questionInstance,
  ({ one, many }) => ({
    abstractTestStage: one(abstractTestStage, {
      fields: [questionInstance.abstractTestStageId],
      references: [abstractTestStage.id],
    }),
    abstractQuestion: one(abstractQuestion, {
      fields: [questionInstance.abstractQuestionId],
      references: [abstractQuestion.id],
    }),
    testStageInstance: one(testStageInstance, {
      fields: [questionInstance.testStageInstanceId],
      references: [testStageInstance.id],
    }),

    answerOptionInstances: many(answerOptionInstance),
  }),
)

export const answerOptionInstanceRelations = relations(
  answerOptionInstance,
  ({ one }) => ({
    abstractQuestion: one(abstractQuestion, {
      fields: [answerOptionInstance.abstractQuestionId],
      references: [abstractQuestion.id],
    }),
    questionInstance: one(questionInstance, {
      fields: [answerOptionInstance.questionInstanceId],
      references: [questionInstance.id],
    }),
    abstractAnswerOption: one(abstractAnswerOption, {
      fields: [answerOptionInstance.abstractAnswerOptionId],
      references: [abstractAnswerOption.id],
    }),
  }),
)

export const educationalSpaceRelations = relations(
  educationalSpace,
  ({ one, many }) => ({
    createdBy: one(user, {
      fields: [educationalSpace.createdByUserId],
      references: [user.id],
    }),

    availableForLaunchTestsM2M: many(availableForLaunchTest),
    launchedTests: many(launchedTest),
    userGroups: many(userGroup),
  }),
)

export const userGroupRelations = relations(userGroup, ({ one, many }) => ({
  educationalSpace: one(educationalSpace, {
    fields: [userGroup.educationalSpaceId],
    references: [educationalSpace.id],
  }),
  createdBy: one(user, {
    fields: [userGroup.createdByUserId],
    references: [user.id],
  }),

  educationalSpaceAccessScopes: many(educationalSpaceAccessScope),
  launchedTestAccessScopes: many(launchedTestAccessScope),
  launchedTestVariantAccessScopes: many(launchedTestVariantAccessScope),
  leaderInAccessScopes: many(userGroupManagementAccessScope, {
    relationName: 'leader',
  }),
  subordinateInAccessScopes: many(userGroupManagementAccessScope, {
    relationName: 'subordinate',
  }),
  usersM2M: many(userToUserGroup),
}))

export const educationalSpaceAccessScopeRelations = relations(
  educationalSpaceAccessScope,
  ({ one }) => ({
    userGroup: one(userGroup, {
      fields: [educationalSpaceAccessScope.userGroupId],
      references: [userGroup.id],
    }),
  }),
)

export const launchedTestAccessScopeRelations = relations(
  launchedTestAccessScope,
  ({ one }) => ({
    userGroup: one(userGroup, {
      fields: [launchedTestAccessScope.userGroupId],
      references: [userGroup.id],
    }),
    launchedTest: one(launchedTest, {
      fields: [launchedTestAccessScope.launchedTestId],
      references: [launchedTest.id],
    }),
  }),
)

export const launchedTestVariantAccessScopeRelations = relations(
  launchedTestVariantAccessScope,
  ({ one }) => ({
    userGroup: one(userGroup, {
      fields: [launchedTestVariantAccessScope.userGroupId],
      references: [userGroup.id],
    }),
    launchedTestVariant: one(launchedTestVariant, {
      fields: [launchedTestVariantAccessScope.launchedTestVariantId],
      references: [launchedTestVariant.id],
    }),
  }),
)

export const userGroupManagementAccessScopeRelations = relations(
  userGroupManagementAccessScope,
  ({ one }) => ({
    leader: one(userGroup, {
      fields: [userGroupManagementAccessScope.leaderUserGroupId],
      references: [userGroup.id],
      relationName: 'leader',
    }),
    subordinate: one(userGroup, {
      fields: [userGroupManagementAccessScope.subordinateUserGroupId],
      references: [userGroup.id],
      relationName: 'subordinate',
    }),
  }),
)

export const userToUserGroupRelations = relations(
  userToUserGroup,
  ({ one }) => ({
    user: one(user, {
      fields: [userToUserGroup.userId],
      references: [user.id],
    }),
    userGroup: one(userGroup, {
      fields: [userToUserGroup.userGroupId],
      references: [userGroup.id],
    }),
  }),
)

// export const tagRelations = relations(tag, ({ many }) => ({
//   contributionsM2M: many(answerOptionIntoTagContribution),
// }));

// export const testAnalyticsModuleRelations = relations(
//   testAnalyticsModule,
//   ({ many }) => ({
//     abstractTestsM2M: many(testAnalyticsModuleToAbstractTest),
//   })
// );

// export const answerOptionIntoTagContributionRelations = relations(
//   answerOptionIntoTagContribution,
//   ({ one }) => ({
//     abstractAnswerOption: one(abstractAnswerOption, {
//       fields: [answerOptionIntoTagContribution.abstractAnswerOptionId],
//       references: [abstractAnswerOption.id],
//     }),
//     tag: one(tag, {
//       fields: [answerOptionIntoTagContribution.tagId],
//       references: [tag.id],
//     }),
//   })
// );

// export const testAnalyticsModuleToAbstractTestRelations = relations(
//   testAnalyticsModuleToAbstractTest,
//   ({ one }) => ({
//     testAnalyticsModule: one(testAnalyticsModule, {
//       fields: [testAnalyticsModuleToAbstractTest.testAnalyticsModuleId],
//       references: [testAnalyticsModule.id],
//     }),
//     abstractTest: one(abstractTest, {
//       fields: [testAnalyticsModuleToAbstractTest.abstractTestId],
//       references: [abstractTest.id],
//     }),
//   })
// );
