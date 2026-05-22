import {
  createInsertSchema,
  createSelectSchema,
} from '@handfish/drizzle-effect';
import { schema } from '@trellisform/database';

export const UserInsertSchema = createInsertSchema(schema.user);
export const AbstractTestInsertSchema = createInsertSchema(schema.abstractTest);
export const AbstractTestVariantInsertSchema = createInsertSchema(
  schema.abstractTestVariant,
);
export const AbstractTestStageInsertSchema = createInsertSchema(
  schema.abstractTestStage,
);
export const AbstractQuestionInsertSchema = createInsertSchema(
  schema.abstractQuestion,
);
export const AbstractAnswerOptionInsertSchema = createInsertSchema(
  schema.abstractAnswerOption,
);
export const SingleCorrectAbstractAnswerOptionInsertSchema = createInsertSchema(
  schema.singleCorrectAbstractAnswerOption,
);
export const AvailableForLaunchTestInsertSchema = createInsertSchema(
  schema.availableForLaunchTest,
);
export const LaunchedTestInsertSchema = createInsertSchema(schema.launchedTest);
export const LaunchedTestVariantInsertSchema = createInsertSchema(
  schema.launchedTestVariant,
);
export const TestVariantAttemptInsertSchema = createInsertSchema(
  schema.testVariantAttempt,
);
export const TestStageInstanceInsertSchema = createInsertSchema(
  schema.testStageInstance,
);
export const QuestionInstanceInsertSchema = createInsertSchema(
  schema.questionInstance,
);
export const AnswerOptionInstanceInsertSchema = createInsertSchema(
  schema.answerOptionInstance,
);
export const EducationalSpaceInsertSchema = createInsertSchema(
  schema.educationalSpace,
);
export const UserGroupInsertSchema = createInsertSchema(schema.userGroup);
export const EducationalSpaceAccessScopeInsertSchema = createInsertSchema(
  schema.educationalSpaceAccessScope,
);
export const LaunchedTestAccessScopeInsertSchema = createInsertSchema(
  schema.launchedTestAccessScope,
);
export const LaunchedTestVariantAccessScopeInsertSchema = createInsertSchema(
  schema.launchedTestVariantAccessScope,
);
export const UserGroupManagementAccessScopeInsertSchema = createInsertSchema(
  schema.userGroupManagementAccessScope,
);
export const UserToUserGroupInsertSchema = createInsertSchema(
  schema.userToUserGroup,
);
// export const TagInsertSchema                               = createInsertSchema(Schema.tag);
// export const TestAnalyticsModuleInsertSchema               = createInsertSchema(Schema.testAnalyticsModule);
// export const AnswerOptionIntoTagContributionInsertSchema   = createInsertSchema(Schema.answerOptionIntoTagContribution);
// export const TestAnalyticsModuleToAbstractTestInsertSchema = createInsertSchema(Schema.testAnalyticsModuleToAbstractTest);

export const UserSelectSchema = createSelectSchema(schema.user);
export const AbstractTestSelectSchema = createSelectSchema(schema.abstractTest);
export const AbstractTestVariantSelectSchema = createSelectSchema(
  schema.abstractTestVariant,
);
export const AbstractTestStageSelectSchema = createSelectSchema(
  schema.abstractTestStage,
);
export const AbstractQuestionSelectSchema = createSelectSchema(
  schema.abstractQuestion,
);
export const AbstractAnswerOptionSelectSchema = createSelectSchema(
  schema.abstractAnswerOption,
);
export const SingleCorrectAbstractAnswerOptionSelectSchema = createSelectSchema(
  schema.singleCorrectAbstractAnswerOption,
);
export const AvailableForLaunchTestSelectSchema = createSelectSchema(
  schema.availableForLaunchTest,
);
export const LaunchedTestSelectSchema = createSelectSchema(schema.launchedTest);
export const LaunchedTestVariantSelectSchema = createSelectSchema(
  schema.launchedTestVariant,
);
export const TestVariantAttemptSelectSchema = createSelectSchema(
  schema.testVariantAttempt,
);
export const TestStageInstanceSelectSchema = createSelectSchema(
  schema.testStageInstance,
);
export const QuestionInstanceSelectSchema = createSelectSchema(
  schema.questionInstance,
);
export const AnswerOptionInstanceSelectSchema = createSelectSchema(
  schema.answerOptionInstance,
);
export const EducationalSpaceSelectSchema = createSelectSchema(
  schema.educationalSpace,
);
export const UserGroupSelectSchema = createSelectSchema(schema.userGroup);
export const EducationalSpaceAccessScopeSelectSchema = createSelectSchema(
  schema.educationalSpaceAccessScope,
);
export const LaunchedTestAccessScopeSelectSchema = createSelectSchema(
  schema.launchedTestAccessScope,
);
export const LaunchedTestVariantAccessScopeSelectSchema = createSelectSchema(
  schema.launchedTestVariantAccessScope,
);
export const UserGroupManagementAccessScopeSelectSchema = createSelectSchema(
  schema.userGroupManagementAccessScope,
);
export const UserToUserGroupSelectSchema = createSelectSchema(
  schema.userToUserGroup,
);
// export const TagSelectSchema                               = createSelectSchema(Schema.tag);
// export const TestAnalyticsModuleSelectSchema               = createSelectSchema(Schema.testAnalyticsModule);
// export const AnswerOptionIntoTagContributionSelectSchema   = createSelectSchema(Schema.answerOptionIntoTagContribution);
// export const TestAnalyticsModuleToAbstractTestSelectSchema = createSelectSchema(Schema.testAnalyticsModuleToAbstractTest);
