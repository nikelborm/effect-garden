import {
  buildEntityPartsPrefixed,
  OptionalProperty,
  withNewStructFields,
} from '@evadev/effect-helpers'

import * as EFunction from 'effect/Function'
import * as Schema from 'effect/Schema'

const addRequiredName = withNewStructFields({
  name: Schema.String,
})

const addOptionalDescription = withNewStructFields({
  description: Schema.String.pipe(OptionalProperty),
})

const addRequiredNameWithOptionalDescription = EFunction.flow(
  addRequiredName,
  addOptionalDescription,
)

const prefix = '@tf/model' as const
const prefixSlashed = `${prefix}/` as const

const buildEntityParts = buildEntityPartsPrefixed(prefix)

///////////////////////////////////////////////////////////////////////////////

export const HowToAddressUserFieldSchema =
  Schema.NonEmptyTrimmedString.annotations({
    identifier: prefixSlashed + 'HowToAddressUser',
    title: 'Обращение к пользователю',
    description:
      'Имя пользователя в наиболее гибком формате, чтобы учесть другие структуры помимо ФИО, которые могут быть например у иностранных студентов',
    examples: ['Иван Иванов', 'Мария Ивановна', 'Сергей Петрович'],
  })

export const UserEmailFieldSchema = Schema.String
export const IsUserEmailVerifiedFieldSchema = Schema.Boolean
export const CanUserCreateEducationalSpacesSchema = Schema.Boolean
export const UserAvatarFieldSchema = Schema.String
export const UserCreatedAtDateFieldSchema = Schema.Date
export const UserUpdatedAtDateFieldSchema = Schema.Date

export const { UserIdFromNumberSchema, UserIdFromStringSchema, UserSchema } =
  buildEntityParts({
    entityName: 'User',
    entityTitle: 'Пользователь',
    entityDescription:
      'Сущность описывающая одного человека зарегистрированного в системе. Один пользователь может иметь несколько идентичностей, у каждой из которых есть свои доступные способы авторизации в системе.',
    idFieldTitle: 'Айди пользователя',
    idFieldDescription: 'Глобальный уникальный идентификатор пользователя',
    otherFields: {
      howToAddressMe: HowToAddressUserFieldSchema,
      email: UserEmailFieldSchema,
      emailVerified: IsUserEmailVerifiedFieldSchema,
      canCreateEducationalSpaces: CanUserCreateEducationalSpacesSchema,
      avatar: UserAvatarFieldSchema.pipe(OptionalProperty),
      createdAt: UserCreatedAtDateFieldSchema,
      updatedAt: UserUpdatedAtDateFieldSchema,
    },
  })

export type User = Schema.Schema.Type<typeof UserSchema>
export type UserId = User['id']

///////////////////////////////////////////////////////////////////////////////

export const AbstractTestNameSchema = Schema.NonEmptyTrimmedString.annotations({
  identifier: prefixSlashed + 'AbstractTestName',
  description: 'Название абстрактного теста',
  examples: [
    'Нахождение НОД и НОК. 6 класс',
    'Нейрохимический определитель темперамента',
    'Действия с векторами, заданными координатами',
  ],
})

export const AbstractTestDescriptionSchema = Schema.NullOr(
  Schema.NonEmptyTrimmedString,
).annotations({
  identifier: prefixSlashed + 'AbstractTestDescription',
  description: 'Опциональное (может быть null) описание абстрактного теста',
  examples: [
    'Работа предназначена для закрепления темы НОД и НОК натуральных чисел. Состоит из 5 заданий.',
    'Нейрохимический определитель темперамента (Fisher Temperament Inventory, FTI) разработала Хелен Фишер - ученая-антрополог, автор книг и «ведущий эксперт по биологии любви и привлекательности». Фишер связывает врожденные свойства темперамента с доминирующей нейрохимической системой мозга (нейротрансмиттеры дофамин и серотонин, гормоны тестостерон и эстроген) и описывает четыре основных типа личности, условно названные Исследователь, Строитель, Руководитель и Дипломат. В отличие от многих, этот тест имеет научное обоснование, а подтверждающие теорию исследования включали МРТ-сканирование мозга.',
  ],
})

export const AbstractTestGoalSchema = Schema.NonEmptyTrimmedString.annotations({
  identifier: prefixSlashed + 'AbstractTestGoal',
  description: 'Цель абстрактного тестирования',
  examples: [
    'Проверить усвоение темы учениками',
    'Узнать темперамент человека, проходящего тестирование',
  ],
})

export const IsAbstractTestReadyToLaunchSchema = Schema.Boolean.annotations({
  identifier: prefixSlashed + 'IsAbstractTestReadyToLaunch',
  description:
    'Завершена ли работа над тестом? Можно ли его запускать и проходить?',
  default: false,
})

export const IsAbstractTestPublicWorldwideSchema = Schema.Boolean.annotations({
  identifier: prefixSlashed + 'IsAbstractTestPublicWorldwide',
  description:
    'Открыт ли доступ для людей со всего мира? Могут ли кто-угодно свободно его смотреть, проходить, запускать без ограничений?',
  default: false,
})

export const {
  AbstractTestIdFromNumberSchema,
  AbstractTestIdFromStringSchema,
  AbstractTestSchema,
} = buildEntityParts({
  entityName: 'AbstractTest',
  entityTitle: 'Абстрактный тест',
  entityDescription:
    'Это просто тест, который можно редактировать, копировать, запускать, проходить, распространять. Важная характеристика, что его можно дополнять, после его создания, и нет никакой гарантии, что он будет со временем оставаться таким же, каким вы его видели в прошлом.',
  idFieldTitle: 'Айди абстрактного теста',
  idFieldDescription:
    'Глобальный уникальный идентификатор абстрактного теста, натуральное число',
  otherFields: {
    name: AbstractTestNameSchema,
    description: AbstractTestDescriptionSchema,
    goal: AbstractTestGoalSchema,
    isReadyToLaunch: IsAbstractTestReadyToLaunchSchema,
    isPublicWorldwide: IsAbstractTestPublicWorldwideSchema,
  },
})

export type AbstractTest = Schema.Schema.Type<typeof AbstractTestSchema>
export type AbstractTestId = AbstractTest['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  AbstractTestVariantIdFromNumberSchema,
  AbstractTestVariantIdFromStringSchema,
  AbstractTestVariantSchema,
} = buildEntityParts({
  entityName: 'AbstractTestVariant',
  entityTitle: 'Вариант абстрактного теста',
  entityDescription: '',
  idFieldTitle: '',
  idFieldDescription:
    'Глобальный уникальный идентификатор варианта абстрактного теста, натуральное число',
  otherFields: {},
  // addOptionalDescription
})

export type AbstractTestVariant = Schema.Schema.Type<
  typeof AbstractTestVariantSchema
>
export type AbstractTestVariantId = AbstractTestVariant['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  AbstractTestStageIdFromNumberSchema,
  AbstractTestStageIdFromStringSchema,
  AbstractTestStageSchema,
} = buildEntityParts({
  entityName: 'AbstractTestStage',
  entityTitle: 'Этап варианта абстрактного теста',
  entityDescription: '',
  idFieldTitle: '',
  idFieldDescription:
    'Глобальный уникальный идентификатор этапа внутри варианте абстрактного теста, натуральное число',
  otherFields: {},
  // addRequiredNameWithOptionalDescription
})

export type AbstractTestStage = Schema.Schema.Type<
  typeof AbstractTestStageSchema
>
export type AbstractTestStageId = AbstractTestStage['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  AbstractQuestionIdFromNumberSchema,
  AbstractQuestionIdFromStringSchema,
  AbstractQuestionSchema,
} = buildEntityParts({
  entityName: 'AbstractQuestion',
  entityTitle: 'Вопрос абстрактного теста',
  entityDescription:
    'Абстрактные вопросы находятся внутри этапов абстрактных тестов',
  idFieldTitle: 'Айди абстрактного вопроса',
  idFieldDescription:
    'Глобальный уникальный идентификатор вопроса внутри этапа абстрактного теста, натуральное число',
  otherFields: {},
  // addRequiredNameWithOptionalDescription
})

export type AbstractQuestion = Schema.Schema.Type<typeof AbstractQuestionSchema>
export type AbstractQuestionId = AbstractQuestion['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  AbstractAnswerOptionIdFromNumberSchema,
  AbstractAnswerOptionIdFromStringSchema,
  AbstractAnswerOptionSchema,
} = buildEntityParts({
  entityName: 'AbstractAnswerOption',
  entityTitle: 'Вариант ответа на вопрос абстрактного теста',
  entityDescription: '',
  idFieldTitle: '',
  idFieldDescription:
    'Глобальный уникальный идентификатор варианта ответа в вопросе из абстрактного теста, натуральное число',
  otherFields: {},
  // addOptionalDescription
})

export type AbstractAnswerOption = Schema.Schema.Type<
  typeof AbstractAnswerOptionSchema
>
export type AbstractAnswerOptionId = AbstractAnswerOption['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  LaunchedTestIdFromNumberSchema,
  LaunchedTestIdFromStringSchema,
  LaunchedTestSchema,
} = buildEntityParts({
  entityName: 'LaunchedTest',
  entityTitle: 'Запущенное тестирование',
  entityDescription: '',
  idFieldTitle: '',
  idFieldDescription:
    'Глобальный уникальный идентификатор запущенного тестирования в образовательном пространстве, натуральное число',
  otherFields: {},
})

export type LaunchedTest = Schema.Schema.Type<typeof LaunchedTestSchema>
export type LaunchedTestId = LaunchedTest['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  LaunchedTestVariantIdFromNumberSchema,
  LaunchedTestVariantIdFromStringSchema,
  LaunchedTestVariantSchema,
} = buildEntityParts({
  entityName: 'LaunchedTestVariant',
  entityTitle: 'Запущенный вариант тестирования',
  entityDescription: '',
  idFieldTitle: '',
  idFieldDescription:
    'Глобальный уникальный идентификатор запущенного варианта тестирования в образовательном пространстве, натуральное число',
  otherFields: {},
})

export type LaunchedTestVariant = Schema.Schema.Type<
  typeof LaunchedTestVariantSchema
>
export type LaunchedTestVariantId = LaunchedTestVariant['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  TestVariantAttemptIdFromNumberSchema,
  TestVariantAttemptIdFromStringSchema,
  TestVariantAttemptSchema,
} = buildEntityParts({
  entityName: 'TestVariantAttempt',
  entityTitle: 'Попытка пройти вариант запущенного тестирования',
  entityDescription: '',
  idFieldTitle: '',
  idFieldDescription:
    'Глобальный уникальный идентификатор попытки пройти вариант теста, натуральное число',
  otherFields: {},
})

export type TestVariantAttempt = Schema.Schema.Type<
  typeof TestVariantAttemptSchema
>
export type TestVariantAttemptId = TestVariantAttempt['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  TestStageInstanceIdFromNumberSchema,
  TestStageInstanceIdFromStringSchema,
  TestStageInstanceSchema,
} = buildEntityParts({
  entityName: 'TestStageInstance',
  entityTitle: 'Этап попытки пройти вариант запущенного тестирования',
  entityDescription: '',
  idFieldTitle: '',
  idFieldDescription:
    'Глобальный уникальный идентификатор инстанса этапа внутри попытки пройти вариант теста, натуральное число',
  otherFields: {},
})

export type TestStageInstance = Schema.Schema.Type<
  typeof TestStageInstanceSchema
>
export type TestStageInstanceId = TestStageInstance['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  QuestionInstanceIdFromNumberSchema,
  QuestionInstanceIdFromStringSchema,
  QuestionInstanceSchema,
} = buildEntityParts({
  entityName: 'QuestionInstance',
  entityTitle: 'Вопрос в попытке пройти вариант запущенного тестирования',
  entityDescription: '',
  idFieldTitle: '',
  idFieldDescription:
    'Глобальный уникальный идентификатор инстанса вопроса внутри попытки пройти вариант теста, натуральное число',
  otherFields: {},
})

export type QuestionInstance = Schema.Schema.Type<typeof QuestionInstanceSchema>
export type QuestionInstanceId = QuestionInstance['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  AnswerOptionInstanceIdFromNumberSchema,
  AnswerOptionInstanceIdFromStringSchema,
  AnswerOptionInstanceSchema,
} = buildEntityParts({
  entityName: 'AnswerOptionInstance',
  entityTitle:
    'Ответ на вопрос в попытке пройти вариант запущенного тестирования',
  entityDescription: '',
  idFieldTitle: '',
  idFieldDescription:
    'Глобальный уникальный идентификатор инстанса варианта ответа на вопрос внутри попытки пройти вариант теста, натуральное число',
  otherFields: {},
})

export type AnswerOptionInstance = Schema.Schema.Type<
  typeof AnswerOptionInstanceSchema
>
export type AnswerOptionInstanceId = AnswerOptionInstance['id']

///////////////////////////////////////////////////////////////////////////////

export const EducationalSpaceNameSchema =
  Schema.NonEmptyTrimmedString.annotations({
    identifier: prefixSlashed + 'EducationalSpaceName',
    description: 'Название образовательного пространства',
    examples: ['Школа № 43', 'Курсы SkillBox'],
  })

export const EducationalSpaceDescriptionSchema =
  Schema.NonEmptyTrimmedString.annotations({
    identifier: prefixSlashed + 'EducationalSpaceDescription',
    description: 'Описание образовательного пространства',
    examples: [
      'Skillbox - один из лидеров российского рынка онлайн-образования. Более 560 образовательных программ по маркетингу, дизайну, программированию, разработке игр, управлению и мультимедиа.',
    ],
  })

export const {
  EducationalSpaceIdFromNumberSchema,
  EducationalSpaceIdFromStringSchema,
  EducationalSpaceSchema,
} = buildEntityParts({
  entityName: 'EducationalSpace',
  entityTitle: 'Образовательное пространство',
  entityDescription: '',
  idFieldTitle: '',
  idFieldDescription:
    'Глобальный уникальный идентификатор образовательного пространства, натуральное число',
  otherFields: {
    name: EducationalSpaceNameSchema,
    description: EducationalSpaceDescriptionSchema,
  },
})

export type EducationalSpace = Schema.Schema.Type<typeof EducationalSpaceSchema>
export type EducationalSpaceId = EducationalSpace['id']

///////////////////////////////////////////////////////////////////////////////

export const {
  UserGroupIdFromNumberSchema,
  UserGroupIdFromStringSchema,
  UserGroupSchema,
} = buildEntityParts({
  entityName: 'UserGroup',
  entityTitle: 'Группа пользователей',
  entityDescription:
    'Группа пользователей, созданная в рамках образовательного пространства',
  idFieldTitle: 'Айди группы пользователей',
  idFieldDescription:
    'Глобальный уникальный идентификатор группы пользователей в образовательном пространстве, натуральное число',
  otherFields: {},
})

export type UserGroup = Schema.Schema.Type<typeof UserGroupSchema>
export type UserGroupId = UserGroup['id']
