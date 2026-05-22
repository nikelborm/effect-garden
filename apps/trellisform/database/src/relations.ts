import { defineRelations } from 'drizzle-orm/relations'

import * as schema from './schema.ts'

export const relationalSchema = defineRelations(schema, r => ({
  user: {
    createdAbstractTests: r.many.abstractTest({
      from: r.user.fastId,
      to: r.abstractTest.createdByUserId,
    }),
    createdAbstractTestVariants: r.many.abstractTestVariant({
      from: r.user.fastId,
      to: r.abstractTestVariant.createdByUserId,
    }),
    createdAbstractTestStages: r.many.abstractTestStage({
      from: r.user.fastId,
      to: r.abstractTestStage.createdByUserId,
    }),
    createdAbstractTestQuestions: r.many.abstractQuestion({
      from: r.user.fastId,
      to: r.abstractQuestion.createdByUserId,
    }),
    createdAbstractAnswerOptions: r.many.abstractAnswerOption({
      from: r.user.fastId,
      to: r.abstractAnswerOption.createdByUserId,
    }),
    launchedTests: r.many.launchedTest({
      from: r.user.fastId,
      to: r.launchedTest.launchedByUserId,
    }),
    attemptedTestVariants: r.many.testVariantAttempt({
      from: r.user.fastId,
      to: r.testVariantAttempt.userId,
    }),
    createdEducationalSpaces: r.many.educationalSpace({
      from: r.user.fastId,
      to: r.educationalSpace.createdByUserId,
    }),
    createdUserGroups: r.many.userGroup({
      from: r.user.fastId,
      to: r.userGroup.createdByUserId,
    }),
    isInUserGroupsM2M: r.many.userToUserGroup({
      from: r.user.fastId,
      to: r.userToUserGroup.userId,
    }),
  },

  abstractTest: {
    createdBy: r.one.user({
      from: r.abstractTest.createdByUserId,
      to: r.user.fastId,
    }),
    abstractTestVariants: r.many.abstractTestVariant({
      from: r.abstractTest.id,
      to: r.abstractTestVariant.abstractTestId,
    }),
    availableForLaunchInEducationalSpacesM2M: r.many.availableForLaunchTest({
      from: r.abstractTest.id,
      to: r.availableForLaunchTest.abstractTestId,
    }),
    launchedTests: r.many.launchedTest({
      from: r.abstractTest.id,
      to: r.launchedTest.abstractTestId,
    }),
    launchedTestVariants: r.many.launchedTestVariant({
      from: r.abstractTest.id,
      to: r.launchedTestVariant.abstractTestId,
    }),
  },

  abstractTestVariant: {
    createdBy: r.one.user({
      from: r.abstractTestVariant.createdByUserId,
      to: r.user.fastId,
    }),
    abstractTest: r.one.abstractTest({
      from: r.abstractTestVariant.abstractTestId,
      to: r.abstractTest.id,
    }),
    stages: r.many.abstractTestStage({
      from: r.abstractTestVariant.id,
      to: r.abstractTestStage.abstractTestVariantId,
    }),
    launchedTestVariants: r.many.launchedTestVariant({
      from: r.abstractTestVariant.id,
      to: r.launchedTestVariant.abstractTestVariantId,
    }),
    testVariantAttempts: r.many.testVariantAttempt({
      from: r.abstractTestVariant.id,
      to: r.testVariantAttempt.abstractTestVariantId,
    }),
    testStageInstances: r.many.testStageInstance({
      from: r.abstractTestVariant.id,
      to: r.testStageInstance.abstractTestVariantId,
    }),
  },

  abstractTestStage: {
    createdBy: r.one.user({
      from: r.abstractTestStage.createdByUserId,
      to: r.user.fastId,
    }),
    abstractTestVariant: r.one.abstractTestVariant({
      from: r.abstractTestStage.abstractTestVariantId,
      to: r.abstractTestVariant.id,
    }),
    questions: r.many.abstractQuestion({
      from: r.abstractTestStage.id,
      to: r.abstractQuestion.abstractTestStageId,
    }),
    instances: r.many.testStageInstance({
      from: r.abstractTestStage.id,
      to: r.testStageInstance.abstractTestStageId,
    }),
    questionInstances: r.many.questionInstance({
      from: r.abstractTestStage.id,
      to: r.questionInstance.abstractTestStageId,
    }),
  },

  abstractQuestion: {
    createdBy: r.one.user({
      from: r.abstractQuestion.createdByUserId,
      to: r.user.fastId,
    }),
    abstractTestStage: r.one.abstractTestStage({
      from: r.abstractQuestion.abstractTestStageId,
      to: r.abstractTestStage.id,
    }),
    correctAnswerOption: r.one.singleCorrectAbstractAnswerOption({
      from: r.abstractQuestion.id,
      to: r.singleCorrectAbstractAnswerOption.abstractQuestionId,
    }),
    answerOptions: r.many.abstractAnswerOption({
      from: r.abstractQuestion.id,
      to: r.abstractAnswerOption.abstractQuestionId,
    }),
    instances: r.many.questionInstance({
      from: r.abstractQuestion.id,
      to: r.questionInstance.abstractQuestionId,
    }),
    answerOptionInstances: r.many.answerOptionInstance({
      from: r.abstractQuestion.id,
      to: r.answerOptionInstance.abstractQuestionId,
    }),
  },

  abstractAnswerOption: {
    createdBy: r.one.user({
      from: r.abstractAnswerOption.createdByUserId,
      to: r.user.fastId,
    }),
    abstractQuestion: r.one.abstractQuestion({
      from: r.abstractAnswerOption.abstractQuestionId,
      to: r.abstractQuestion.id,
    }),
    correctResultOfQuestion: r.one.singleCorrectAbstractAnswerOption({
      from: r.abstractAnswerOption.id,
      to: r.singleCorrectAbstractAnswerOption.abstractAnswerOptionId,
    }),
    instances: r.many.answerOptionInstance({
      from: r.abstractAnswerOption.id,
      to: r.answerOptionInstance.abstractAnswerOptionId,
    }),
  },

  singleCorrectAbstractAnswerOption: {
    abstractQuestion: r.one.abstractQuestion({
      from: r.singleCorrectAbstractAnswerOption.abstractQuestionId,
      to: r.abstractQuestion.id,
    }),
    abstractAnswerOption: r.one.abstractAnswerOption({
      from: [
        r.singleCorrectAbstractAnswerOption.abstractQuestionId,
        r.singleCorrectAbstractAnswerOption.abstractAnswerOptionId,
      ],
      to: [
        r.abstractAnswerOption.abstractQuestionId,
        r.abstractAnswerOption.id,
      ],
    }),
  },

  availableForLaunchTest: {
    abstractTest: r.one.abstractTest({
      from: r.availableForLaunchTest.abstractTestId,
      to: r.abstractTest.id,
    }),
    educationalSpace: r.one.educationalSpace({
      from: r.availableForLaunchTest.educationalSpaceId,
      to: r.educationalSpace.id,
    }),
  },

  launchedTest: {
    abstractTest: r.one.abstractTest({
      from: r.launchedTest.abstractTestId,
      to: r.abstractTest.id,
    }),
    educationalSpace: r.one.educationalSpace({
      from: r.launchedTest.educationalSpaceId,
      to: r.educationalSpace.id,
    }),
    launchedBy: r.one.user({
      from: r.launchedTest.launchedByUserId,
      to: r.user.fastId,
    }),
    launchedVariants: r.many.launchedTestVariant({
      from: r.launchedTest.id,
      to: r.launchedTestVariant.launchedTestId,
    }),
    accessScopes: r.many.launchedTestAccessScope({
      from: r.launchedTest.id,
      to: r.launchedTestAccessScope.launchedTestId,
    }),
  },

  launchedTestVariant: {
    abstractTest: r.one.abstractTest({
      from: r.launchedTestVariant.abstractTestId,
      to: r.abstractTest.id,
    }),
    abstractTestVariant: r.one.abstractTestVariant({
      from: [
        r.launchedTestVariant.abstractTestId,
        r.launchedTestVariant.abstractTestVariantId,
      ],
      to: [r.abstractTestVariant.abstractTestId, r.abstractTestVariant.id],
    }),
    launchedTest: r.one.launchedTest({
      from: [
        r.launchedTestVariant.abstractTestId,
        r.launchedTestVariant.launchedTestId,
      ],
      to: [r.launchedTest.abstractTestId, r.launchedTest.id],
    }),
    attempts: r.many.testVariantAttempt({
      from: r.launchedTestVariant.id,
      to: r.testVariantAttempt.launchedTestVariantId,
    }),
    accessScopes: r.many.launchedTestVariantAccessScope({
      from: r.launchedTestVariant.id,
      to: r.launchedTestVariantAccessScope.launchedTestVariantId,
    }),
  },

  testVariantAttempt: {
    user: r.one.user({
      from: r.testVariantAttempt.userId,
      to: r.user.fastId,
    }),
    abstractTestVariant: r.one.abstractTestVariant({
      from: r.testVariantAttempt.abstractTestVariantId,
      to: r.abstractTestVariant.id,
    }),
    launchedTestVariant: r.one.launchedTestVariant({
      from: [
        r.testVariantAttempt.abstractTestVariantId,
        r.testVariantAttempt.launchedTestVariantId,
      ],
      to: [
        r.launchedTestVariant.abstractTestVariantId,
        r.launchedTestVariant.id,
      ],
    }),
    testStageInstances: r.many.testStageInstance({
      from: r.testVariantAttempt.id,
      to: r.testStageInstance.testVariantAttemptId,
    }),
  },

  testStageInstance: {
    abstractTestVariant: r.one.abstractTestVariant({
      from: r.testStageInstance.abstractTestVariantId,
      to: r.abstractTestVariant.id,
    }),
    testVariantAttempt: r.one.testVariantAttempt({
      from: [
        r.testStageInstance.abstractTestVariantId,
        r.testStageInstance.testVariantAttemptId,
      ],
      to: [r.testVariantAttempt.abstractTestVariantId, r.testVariantAttempt.id],
    }),
    abstractTestStage: r.one.abstractTestStage({
      from: [
        r.testStageInstance.abstractTestVariantId,
        r.testStageInstance.abstractTestStageId,
      ],
      to: [r.abstractTestStage.abstractTestVariantId, r.abstractTestStage.id],
    }),
    questionInstances: r.many.questionInstance({
      from: r.testStageInstance.id,
      to: r.questionInstance.testStageInstanceId,
    }),
  },

  questionInstance: {
    abstractTestStage: r.one.abstractTestStage({
      from: r.questionInstance.abstractTestStageId,
      to: r.abstractTestStage.id,
    }),
    abstractQuestion: r.one.abstractQuestion({
      from: [
        r.questionInstance.abstractTestStageId,
        r.questionInstance.abstractQuestionId,
      ],
      to: [r.abstractQuestion.abstractTestStageId, r.abstractQuestion.id],
    }),
    testStageInstance: r.one.testStageInstance({
      from: [
        r.questionInstance.abstractTestStageId,
        r.questionInstance.testStageInstanceId,
      ],
      to: [r.testStageInstance.abstractTestStageId, r.testStageInstance.id],
    }),
    answerOptionInstances: r.many.answerOptionInstance({
      from: r.questionInstance.id,
      to: r.answerOptionInstance.questionInstanceId,
    }),
  },

  answerOptionInstance: {
    abstractQuestion: r.one.abstractQuestion({
      from: r.answerOptionInstance.abstractQuestionId,
      to: r.abstractQuestion.id,
    }),
    questionInstance: r.one.questionInstance({
      from: [
        r.answerOptionInstance.abstractQuestionId,
        r.answerOptionInstance.questionInstanceId,
      ],
      to: [r.questionInstance.abstractQuestionId, r.questionInstance.id],
    }),
    abstractAnswerOption: r.one.abstractAnswerOption({
      from: [
        r.answerOptionInstance.abstractQuestionId,
        r.answerOptionInstance.abstractAnswerOptionId,
      ],
      to: [
        r.abstractAnswerOption.abstractQuestionId,
        r.abstractAnswerOption.id,
      ],
    }),
  },

  educationalSpace: {
    createdBy: r.one.user({
      from: r.educationalSpace.createdByUserId,
      to: r.user.fastId,
    }),
    availableForLaunchTestsM2M: r.many.availableForLaunchTest({
      from: r.educationalSpace.id,
      to: r.availableForLaunchTest.educationalSpaceId,
    }),
    launchedTests: r.many.launchedTest({
      from: r.educationalSpace.id,
      to: r.launchedTest.educationalSpaceId,
    }),
    userGroups: r.many.userGroup({
      from: r.educationalSpace.id,
      to: r.userGroup.educationalSpaceId,
    }),
  },

  userGroup: {
    educationalSpace: r.one.educationalSpace({
      from: r.userGroup.educationalSpaceId,
      to: r.educationalSpace.id,
    }),
    createdBy: r.one.user({
      from: r.userGroup.createdByUserId,
      to: r.user.fastId,
    }),
    educationalSpaceAccessScopes: r.many.educationalSpaceAccessScope({
      from: r.userGroup.id,
      to: r.educationalSpaceAccessScope.userGroupId,
    }),
    launchedTestAccessScopes: r.many.launchedTestAccessScope({
      from: r.userGroup.id,
      to: r.launchedTestAccessScope.userGroupId,
    }),
    launchedTestVariantAccessScopes: r.many.launchedTestVariantAccessScope({
      from: r.userGroup.id,
      to: r.launchedTestVariantAccessScope.userGroupId,
    }),
    leaderInAccessScopes: r.many.userGroupManagementAccessScope({
      from: r.userGroup.id,
      to: r.userGroupManagementAccessScope.leaderUserGroupId,
    }),
    subordinateInAccessScopes: r.many.userGroupManagementAccessScope({
      from: r.userGroup.id,
      to: r.userGroupManagementAccessScope.subordinateUserGroupId,
    }),
    usersM2M: r.many.userToUserGroup({
      from: r.userGroup.id,
      to: r.userToUserGroup.userGroupId,
    }),
  },

  educationalSpaceAccessScope: {
    userGroup: r.one.userGroup({
      from: r.educationalSpaceAccessScope.userGroupId,
      to: r.userGroup.id,
    }),
  },

  launchedTestAccessScope: {
    userGroup: r.one.userGroup({
      from: r.launchedTestAccessScope.userGroupId,
      to: r.userGroup.id,
    }),
    launchedTest: r.one.launchedTest({
      from: r.launchedTestAccessScope.launchedTestId,
      to: r.launchedTest.id,
    }),
  },

  launchedTestVariantAccessScope: {
    userGroup: r.one.userGroup({
      from: r.launchedTestVariantAccessScope.userGroupId,
      to: r.userGroup.id,
    }),
    launchedTestVariant: r.one.launchedTestVariant({
      from: r.launchedTestVariantAccessScope.launchedTestVariantId,
      to: r.launchedTestVariant.id,
    }),
  },

  userGroupManagementAccessScope: {
    leader: r.one.userGroup({
      from: r.userGroupManagementAccessScope.leaderUserGroupId,
      to: r.userGroup.id,
    }),
    subordinate: r.one.userGroup({
      from: r.userGroupManagementAccessScope.subordinateUserGroupId,
      to: r.userGroup.id,
    }),
  },

  userToUserGroup: {
    user: r.one.user({
      from: r.userToUserGroup.userId,
      to: r.user.fastId,
    }),
    userGroup: r.one.userGroup({
      from: r.userToUserGroup.userGroupId,
      to: r.userGroup.id,
    }),
  },
}))
