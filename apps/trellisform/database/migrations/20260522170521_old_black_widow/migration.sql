CREATE TYPE "abstract_question_answer_choice_type_enum" AS ENUM('selectOne', 'selectMany', 'noSelect');--> statement-breakpoint
CREATE TYPE "abstract_question_data_type_of_answers_enum" AS ENUM('string', 'integer', 'decimal', 'date');--> statement-breakpoint
CREATE TYPE "educational_space_access_scope_type_enum" AS ENUM('addOwnAbstractTestsIntoEducationalSpaceCatalog', 'viewLaunchedTests', 'modifyLaunchedTests', 'viewUserGroups', 'modifyUserGroups', 'modifySpaceInfo', 'modifyAccessScopesInSpace', 'deleteOwnSpace');--> statement-breakpoint
CREATE TYPE "launched_test_access_scope_type_enum" AS ENUM('viewAnalytics', 'viewUsersFinishedTest', 'makeTestAttempts');--> statement-breakpoint
CREATE TYPE "launched_test_variant_access_scope_type_enum" AS ENUM('viewAnalytics', 'viewUsersFinishedTest', 'makeTestAttempts');--> statement-breakpoint
CREATE TYPE "test_analytics_module_support_enum" AS ENUM('analyticsOfUserAttempt', 'analyticsOfAllAttemptsOfLaunchedTest');--> statement-breakpoint
CREATE TYPE "test_attempt_status_enum" AS ENUM('draft', 'finishedAttempt');--> statement-breakpoint
CREATE TYPE "user_group_management_access_scope_type_enum" AS ENUM('inviteUsers', 'removeUsers', 'viewUsers', 'launchTest', 'assignAliasesOfUsersFromSubordinateGroups');--> statement-breakpoint
CREATE TABLE "abstract_answer_option" (
	"abstract_answer_option_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "abstract_answer_option_abstract_answer_option_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"order" serial CONSTRAINT "UQ_abstract_answer_option_order" UNIQUE,
	"description" varchar,
	"text_of_selectable_answer" varchar,
	"abstract_question_id" bigint NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_abstract_answer_option" PRIMARY KEY("abstract_answer_option_id"),
	CONSTRAINT "UQ_AbstractAnswerOptionAbstractQuestionIdAbstractAnswerOptionId" UNIQUE("abstract_question_id","abstract_answer_option_id")
);
--> statement-breakpoint
CREATE TABLE "abstract_question" (
	"abstract_question_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "abstract_question_abstract_question_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"description" varchar,
	"abstract_test_stage_id" bigint NOT NULL,
	"order" serial CONSTRAINT "UQ_abstract_question_order" UNIQUE,
	"is_additional_free_field_answer_enabled" boolean DEFAULT false NOT NULL,
	"answer_choice_type" "abstract_question_answer_choice_type_enum" DEFAULT 'selectOne'::"abstract_question_answer_choice_type_enum" NOT NULL,
	"data_type_of_free_field_answers" "abstract_question_data_type_of_answers_enum",
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_abstract_question" PRIMARY KEY("abstract_question_id"),
	CONSTRAINT "UQ_AbstractQuestionAbstractTestStageIdAbstractQuestionId" UNIQUE("abstract_test_stage_id","abstract_question_id")
);
--> statement-breakpoint
CREATE TABLE "abstract_test" (
	"abstract_test_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "abstract_test_abstract_test_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"description" varchar,
	"goal" varchar NOT NULL,
	"is_ready_to_launch" boolean DEFAULT false NOT NULL,
	"is_public_worldwide" boolean DEFAULT false NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_abstract_test" PRIMARY KEY("abstract_test_id")
);
--> statement-breakpoint
CREATE TABLE "abstract_test_stage" (
	"abstract_test_stage_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "abstract_test_stage_abstract_test_stage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"order" serial CONSTRAINT "UQ_abstract_test_stage_order" UNIQUE,
	"name" varchar NOT NULL,
	"description" varchar,
	"abstract_test_variant_id" bigint NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_abstract_test_stage" PRIMARY KEY("abstract_test_stage_id"),
	CONSTRAINT "UQ_AbstractTestStageAbstractTestVariantIdAbstractTestStageId" UNIQUE("abstract_test_variant_id","abstract_test_stage_id")
);
--> statement-breakpoint
CREATE TABLE "abstract_test_variant" (
	"abstract_test_variant_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "abstract_test_variant_abstract_test_variant_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"description" varchar,
	"is_artificially_generated" boolean NOT NULL,
	"is_ready_to_launch" boolean DEFAULT false NOT NULL,
	"is_public_worldwide" boolean DEFAULT false NOT NULL,
	"abstract_test_id" bigint NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_abstract_test_variant" PRIMARY KEY("abstract_test_variant_id"),
	CONSTRAINT "UQ_AbstractTestVariantAbstractTestIdAbstractTestVariantId" UNIQUE("abstract_test_id","abstract_test_variant_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "answer_option_instance" (
	"answer_option_instance_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "answer_option_instance_answer_option_instance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"abstract_question_id" bigint NOT NULL,
	"question_instance_id" bigint NOT NULL,
	"abstract_answer_option_id" bigint NOT NULL,
	"order" serial CONSTRAINT "UQ_answer_option_instance_order" UNIQUE,
	"is_selected" boolean DEFAULT false,
	CONSTRAINT "PK_answer_option_instance" PRIMARY KEY("answer_option_instance_id"),
	CONSTRAINT "UQ_AnswerOptionInstanceAbstractAnswerOptionIdAnswerOptionIId" UNIQUE("abstract_answer_option_id","answer_option_instance_id"),
	CONSTRAINT "UQ_AnswerOptionInstanceQuestionInstanceIdAbstractAnswerOptionId" UNIQUE("question_instance_id","abstract_answer_option_id")
);
--> statement-breakpoint
CREATE TABLE "available_for_launch_test" (
	"abstract_test_id" bigint,
	"educational_space_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_available_for_launch_test" PRIMARY KEY("abstract_test_id","educational_space_id")
);
--> statement-breakpoint
CREATE TABLE "educational_space" (
	"educational_space_id" integer GENERATED ALWAYS AS IDENTITY (sequence name "educational_space_educational_space_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"description" varchar,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_educational_space" PRIMARY KEY("educational_space_id")
);
--> statement-breakpoint
CREATE TABLE "educational_space_access_scope" (
	"type" "educational_space_access_scope_type_enum",
	"user_group_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_educational_space_access_scope" PRIMARY KEY("user_group_id","type")
);
--> statement-breakpoint
CREATE TABLE "launched_test" (
	"launched_test_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "launched_test_launched_test_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"opening_date" timestamp with time zone,
	"closing_date" timestamp with time zone,
	"maximum_attempt_duration_in_minutes" smallint,
	"maximum_amount_of_attempts" smallint,
	"should_reorder_stages_for_each_student" boolean,
	"should_reorder_questions_in_stages_for_each_student" boolean,
	"should_reorder_answers_in_stages_for_each_student" boolean,
	"abstract_test_id" bigint NOT NULL,
	"educational_space_id" integer NOT NULL,
	"launched_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_launched_test" PRIMARY KEY("launched_test_id"),
	CONSTRAINT "UQ_launched_test_abstract_test_id_launched_test_id" UNIQUE("abstract_test_id","launched_test_id")
);
--> statement-breakpoint
CREATE TABLE "launched_test_access_scope" (
	"type" "launched_test_access_scope_type_enum",
	"user_group_id" integer,
	"launched_test_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_launched_test_access_scope" PRIMARY KEY("user_group_id","launched_test_id","type")
);
--> statement-breakpoint
CREATE TABLE "launched_test_variant" (
	"launched_test_variant_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "launched_test_variant_launched_test_variant_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"abstract_test_id" bigint NOT NULL,
	"abstract_test_variant_id" bigint NOT NULL,
	"launched_test_id" bigint NOT NULL,
	"should_reorder_stages_for_each_student" boolean,
	"should_reorder_questions_in_stages_for_each_student" boolean,
	"should_reorder_answers_in_stages_for_each_student" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_launched_test_variant" PRIMARY KEY("launched_test_variant_id"),
	CONSTRAINT "UQ_LaunchedTestVariantAbstractTestVariantIdLTestVariantId" UNIQUE("abstract_test_variant_id","launched_test_variant_id"),
	CONSTRAINT "UQ_LaunchedTestVariantLaunchedTestIdAbstractTestVariantId" UNIQUE("launched_test_id","abstract_test_variant_id")
);
--> statement-breakpoint
CREATE TABLE "launched_test_variant_access_scope" (
	"type" "launched_test_variant_access_scope_type_enum",
	"user_group_id" integer,
	"launched_test_variant_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_launched_test_variant_access_scope" PRIMARY KEY("user_group_id","launched_test_variant_id","type")
);
--> statement-breakpoint
CREATE TABLE "question_instance" (
	"question_instance_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "question_instance_question_instance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"abstract_test_stage_id" bigint NOT NULL,
	"test_stage_instance_id" bigint NOT NULL,
	"abstract_question_id" bigint NOT NULL,
	"order" serial CONSTRAINT "UQ_question_instance_order" UNIQUE,
	"free_field_answer" varchar,
	CONSTRAINT "PK_question_instance" PRIMARY KEY("question_instance_id"),
	CONSTRAINT "UQ_question_instance_abstract_question_id_question_instance_id" UNIQUE("abstract_question_id","question_instance_id"),
	CONSTRAINT "UQ_QuestionInstanceTestStageInstanceIdAbstractQuestionId" UNIQUE("test_stage_instance_id","abstract_question_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "single_correct_abstract_answer_option" (
	"abstract_question_id" bigint,
	"abstract_answer_option_id" bigint NOT NULL,
	"score_contribution" real NOT NULL,
	CONSTRAINT "PK_single_correct_abstract_answer_option" PRIMARY KEY("abstract_question_id")
);
--> statement-breakpoint
CREATE TABLE "test_stage_instance" (
	"test_stage_instance_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "test_stage_instance_test_stage_instance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"abstract_test_variant_id" bigint NOT NULL,
	"test_variant_attempt_id" bigint NOT NULL,
	"abstract_test_stage_id" bigint NOT NULL,
	"order" serial CONSTRAINT "UQ_test_stage_instance_order" UNIQUE,
	CONSTRAINT "PK_test_stage_instance" PRIMARY KEY("test_stage_instance_id"),
	CONSTRAINT "UQ_TestStageInstanceAbstractTestStageIdTestStageInstanceId" UNIQUE("abstract_test_stage_id","test_stage_instance_id"),
	CONSTRAINT "UQ_TestStageInstanceTestVariantAttemptIdAbstractTestStageId" UNIQUE("test_variant_attempt_id","abstract_test_stage_id")
);
--> statement-breakpoint
CREATE TABLE "test_variant_attempt" (
	"test_variant_attempt_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "test_variant_attempt_test_variant_attempt_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"abstract_test_variant_id" bigint NOT NULL,
	"launched_test_variant_id" bigint NOT NULL,
	"finished_at_date" timestamp with time zone,
	"last_saved_at_date" timestamp with time zone,
	"status" "test_attempt_status_enum" NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_test_variant_attempt" PRIMARY KEY("test_variant_attempt_id"),
	CONSTRAINT "UQ_TestVariantAttemptAbstractTestVariantIdTestVariantAttemptId" UNIQUE("abstract_test_variant_id","test_variant_attempt_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"user_id" integer GENERATED ALWAYS AS IDENTITY (sequence name "user_user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_uuid_for_better_auth" text NOT NULL CONSTRAINT "UQ_user_user_uuid_for_better_auth" UNIQUE,
	"how_to_address_me" varchar NOT NULL,
	"email" varchar NOT NULL CONSTRAINT "UQ_user_email" UNIQUE,
	"is_email_verified" boolean NOT NULL,
	"can_create_educational_spaces" boolean NOT NULL,
	"avatar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_user" PRIMARY KEY("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_group" (
	"user_group_id" integer GENERATED ALWAYS AS IDENTITY (sequence name "user_group_user_group_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"description" varchar,
	"educational_space_id" integer NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_user_group" PRIMARY KEY("user_group_id")
);
--> statement-breakpoint
CREATE TABLE "user_group_management_access_scope" (
	"type" "user_group_management_access_scope_type_enum",
	"leader_user_group_id" integer,
	"subordinate_user_group_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_user_group_management_access_scope" PRIMARY KEY("leader_user_group_id","subordinate_user_group_id","type")
);
--> statement-breakpoint
CREATE TABLE "user_to_user_group" (
	"user_group_id" integer,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_user_to_user_group" PRIMARY KEY("user_group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "abstract_answer_option" ADD CONSTRAINT "FK_abstract_answer_option_abstract_question_id" FOREIGN KEY ("abstract_question_id") REFERENCES "abstract_question"("abstract_question_id");--> statement-breakpoint
ALTER TABLE "abstract_answer_option" ADD CONSTRAINT "FK_abstract_answer_option_created_by_user_id_user" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id");--> statement-breakpoint
ALTER TABLE "abstract_question" ADD CONSTRAINT "FK_abstract_question_abstract_test_stage_id" FOREIGN KEY ("abstract_test_stage_id") REFERENCES "abstract_test_stage"("abstract_test_stage_id");--> statement-breakpoint
ALTER TABLE "abstract_question" ADD CONSTRAINT "FK_abstract_question_created_by_user_id_user" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id");--> statement-breakpoint
ALTER TABLE "abstract_test" ADD CONSTRAINT "FK_abstract_test_created_by_user_id_user" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id");--> statement-breakpoint
ALTER TABLE "abstract_test_stage" ADD CONSTRAINT "FK_abstract_test_stage_abstract_test_variant_id" FOREIGN KEY ("abstract_test_variant_id") REFERENCES "abstract_test_variant"("abstract_test_variant_id");--> statement-breakpoint
ALTER TABLE "abstract_test_stage" ADD CONSTRAINT "FK_abstract_test_stage_created_by_user_id_user" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id");--> statement-breakpoint
ALTER TABLE "abstract_test_variant" ADD CONSTRAINT "FK_abstract_test_variant_abstract_test_id" FOREIGN KEY ("abstract_test_id") REFERENCES "abstract_test"("abstract_test_id");--> statement-breakpoint
ALTER TABLE "abstract_test_variant" ADD CONSTRAINT "FK_abstract_test_variant_created_by_user_id_user" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_user_uuid_for_better_auth_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_uuid_for_better_auth") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "answer_option_instance" ADD CONSTRAINT "FK_AnswerOptionInstanceAbstractQuestionIdQuestionIIdQIAQIdQIId" FOREIGN KEY ("abstract_question_id","question_instance_id") REFERENCES "question_instance"("abstract_question_id","question_instance_id");--> statement-breakpoint
ALTER TABLE "answer_option_instance" ADD CONSTRAINT "FK_AnswerOptionIAQIdAAnswerOptionIdAAnswerOptionAQIdAAnswerOId" FOREIGN KEY ("abstract_question_id","abstract_answer_option_id") REFERENCES "abstract_answer_option"("abstract_question_id","abstract_answer_option_id");--> statement-breakpoint
ALTER TABLE "available_for_launch_test" ADD CONSTRAINT "FK_available_for_launch_test_abstract_test_id" FOREIGN KEY ("abstract_test_id") REFERENCES "abstract_test"("abstract_test_id");--> statement-breakpoint
ALTER TABLE "available_for_launch_test" ADD CONSTRAINT "FK_available_for_launch_test_educational_space_id" FOREIGN KEY ("educational_space_id") REFERENCES "educational_space"("educational_space_id");--> statement-breakpoint
ALTER TABLE "educational_space" ADD CONSTRAINT "FK_educational_space_created_by_user_id_user" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id");--> statement-breakpoint
ALTER TABLE "educational_space_access_scope" ADD CONSTRAINT "FK_educational_space_access_scope_user_group_id" FOREIGN KEY ("user_group_id") REFERENCES "user_group"("user_group_id");--> statement-breakpoint
ALTER TABLE "launched_test" ADD CONSTRAINT "FK_launched_test_abstract_test_id" FOREIGN KEY ("abstract_test_id") REFERENCES "abstract_test"("abstract_test_id");--> statement-breakpoint
ALTER TABLE "launched_test" ADD CONSTRAINT "FK_launched_test_educational_space_id" FOREIGN KEY ("educational_space_id") REFERENCES "educational_space"("educational_space_id");--> statement-breakpoint
ALTER TABLE "launched_test" ADD CONSTRAINT "FK_launched_test_launched_by_user_id_user" FOREIGN KEY ("launched_by_user_id") REFERENCES "user"("user_id");--> statement-breakpoint
ALTER TABLE "launched_test_access_scope" ADD CONSTRAINT "FK_launched_test_access_scope_user_group_id" FOREIGN KEY ("user_group_id") REFERENCES "user_group"("user_group_id");--> statement-breakpoint
ALTER TABLE "launched_test_access_scope" ADD CONSTRAINT "FK_launched_test_access_scope_launched_test_id" FOREIGN KEY ("launched_test_id") REFERENCES "launched_test"("launched_test_id");--> statement-breakpoint
ALTER TABLE "launched_test_variant" ADD CONSTRAINT "FK_LTestVariantATestIdATestVariantIdATestVariantATestIdATestVId" FOREIGN KEY ("abstract_test_id","abstract_test_variant_id") REFERENCES "abstract_test_variant"("abstract_test_id","abstract_test_variant_id");--> statement-breakpoint
ALTER TABLE "launched_test_variant" ADD CONSTRAINT "FK_LaunchedTestVariantAbstractTestIdLTestIdLTestATestIdLTestId" FOREIGN KEY ("abstract_test_id","launched_test_id") REFERENCES "launched_test"("abstract_test_id","launched_test_id");--> statement-breakpoint
ALTER TABLE "launched_test_variant_access_scope" ADD CONSTRAINT "FK_launched_test_variant_access_scope_user_group_id" FOREIGN KEY ("user_group_id") REFERENCES "user_group"("user_group_id");--> statement-breakpoint
ALTER TABLE "launched_test_variant_access_scope" ADD CONSTRAINT "FK_launched_test_variant_access_scope_launched_test_variant_id" FOREIGN KEY ("launched_test_variant_id") REFERENCES "launched_test_variant"("launched_test_variant_id");--> statement-breakpoint
ALTER TABLE "question_instance" ADD CONSTRAINT "FK_QIATestStageIdTestStageIIdTestStageIATestStageIdTestStageIId" FOREIGN KEY ("abstract_test_stage_id","test_stage_instance_id") REFERENCES "test_stage_instance"("abstract_test_stage_id","test_stage_instance_id");--> statement-breakpoint
ALTER TABLE "question_instance" ADD CONSTRAINT "FK_QuestionInstanceAbstractTestStageIdAQIdAQATestStageIdAQId" FOREIGN KEY ("abstract_test_stage_id","abstract_question_id") REFERENCES "abstract_question"("abstract_test_stage_id","abstract_question_id");--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_user_uuid_for_better_auth_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_uuid_for_better_auth") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "single_correct_abstract_answer_option" ADD CONSTRAINT "FK_SingleCAAnswerOptionAQIdAAnswerOptionIdAAnswerOAQIdAAOId" FOREIGN KEY ("abstract_question_id","abstract_answer_option_id") REFERENCES "abstract_answer_option"("abstract_question_id","abstract_answer_option_id");--> statement-breakpoint
ALTER TABLE "test_stage_instance" ADD CONSTRAINT "FK_TestStageIATestVariantIdTestVariantAIdTestVAATestVIdTestVAId" FOREIGN KEY ("abstract_test_variant_id","test_variant_attempt_id") REFERENCES "test_variant_attempt"("abstract_test_variant_id","test_variant_attempt_id");--> statement-breakpoint
ALTER TABLE "test_stage_instance" ADD CONSTRAINT "FK_TestStageIATestVIdATestStageIdATestStageATestVIdATestStageId" FOREIGN KEY ("abstract_test_variant_id","abstract_test_stage_id") REFERENCES "abstract_test_stage"("abstract_test_variant_id","abstract_test_stage_id");--> statement-breakpoint
ALTER TABLE "test_variant_attempt" ADD CONSTRAINT "FK_TestVariantAttemptATestVIdLTestVIdLTestVATestVIdLTestVId" FOREIGN KEY ("abstract_test_variant_id","launched_test_variant_id") REFERENCES "launched_test_variant"("abstract_test_variant_id","launched_test_variant_id");--> statement-breakpoint
ALTER TABLE "test_variant_attempt" ADD CONSTRAINT "FK_test_variant_attempt_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("user_id");--> statement-breakpoint
ALTER TABLE "user_group" ADD CONSTRAINT "FK_user_group_educational_space_id" FOREIGN KEY ("educational_space_id") REFERENCES "educational_space"("educational_space_id");--> statement-breakpoint
ALTER TABLE "user_group" ADD CONSTRAINT "FK_user_group_created_by_user_id_user" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("user_id");--> statement-breakpoint
ALTER TABLE "user_group_management_access_scope" ADD CONSTRAINT "FK_UserGroupManagementAccessScopeLeaderUserGroupIdUserGroup" FOREIGN KEY ("leader_user_group_id") REFERENCES "user_group"("user_group_id");--> statement-breakpoint
ALTER TABLE "user_group_management_access_scope" ADD CONSTRAINT "FK_UserGroupManagementAccessScopeSUserGroupIdUserGroup" FOREIGN KEY ("subordinate_user_group_id") REFERENCES "user_group"("user_group_id");--> statement-breakpoint
ALTER TABLE "user_to_user_group" ADD CONSTRAINT "FK_user_to_user_group_user_group_id" FOREIGN KEY ("user_group_id") REFERENCES "user_group"("user_group_id");--> statement-breakpoint
ALTER TABLE "user_to_user_group" ADD CONSTRAINT "FK_user_to_user_group_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("user_id");