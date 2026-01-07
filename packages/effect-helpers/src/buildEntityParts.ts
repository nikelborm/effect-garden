import { type Brand, Schema } from 'effect'

import { changeEncodedTypeToString } from './changeEncodedTypeToString.ts'
import {
  withOpenApiAnnotationsForStructs as _withOpenApiAnnotationsForStructs,
  type EnsureTaggedStructWithStringLiteral,
} from './withOpenApiAnnotations.ts'
import {
  withDescriptionSchemaAnnotation,
  withSchemaIdAndIdentifierAnnotations,
  withTitleSchemaAnnotation,
} from './withSchemaAnnotation.ts'

const ID = Schema.Number.pipe(
  Schema.int(),
  Schema.positive({ examples: [1, 200, 6719] }),
  Schema.asSchema,
)

export const buildEntityPartsPrefixed = (prefix: string) => {
  const withOpenApiAnnotations = _withOpenApiAnnotationsForStructs(prefix)
  const withIdsAnnotations = withSchemaIdAndIdentifierAnnotations(prefix)

  return <
    const EntityName extends string,
    Fields extends Schema.Struct.Fields,
  >({
    entityName,
    entityTitle,
    entityDescription,
    idFieldTitle,
    idFieldDescription,
    otherFields,
  }: {
    entityName: EntityName
    idFieldDescription: string
    entityTitle: string
    idFieldTitle: string
    entityDescription: string
    otherFields: Fields
  }): EntityParts<EntityName, Fields> => {
    // TODO maybe add here also primaryKey annotation?
    // like this: primaryKey: (req) => `TTLRequest:${req.id}`

    const EntityId = `${entityName}Id` as const

    type EntityId = typeof EntityId

    const withEntityIdBrandSchema = Schema.brand(EntityId)

    const BrandContainer = {
      [`with${EntityId}Brand`]: withEntityIdBrandSchema,
    } as BrandContainer<EntityName>

    const EntityIdFromNumberSchema = ID.pipe(
      withEntityIdBrandSchema,
      withTitleSchemaAnnotation(idFieldTitle),
      withDescriptionSchemaAnnotation(idFieldDescription),
      withIdsAnnotations(`${EntityId}FromNumber`),
      Schema.asSchema,
    )

    const EntityIdFromNumberSchemaContainer = {
      [`${EntityId}FromNumberSchema`]: EntityIdFromNumberSchema,
    } as EntityIdFromNumberSchemaContainer<EntityName>

    const EntityIdFromStringSchema = EntityIdFromNumberSchema.pipe(
      changeEncodedTypeToString,
      withIdsAnnotations(`${EntityId}FromString`),
    )

    const EntityIdFromStringSchemaContainer = {
      [`${EntityId}FromStringSchema`]: EntityIdFromStringSchema,
    } as EntityIdFromStringSchemaContainer<EntityName>

    // TODO: report issue to Typescript: Type '"_tag" | "id" | "sad2" | "sad" |
    // keyof Fields' is not assignable to type '"_tag" | "id" | "sad2" | "sad" |
    // Exclude<Exclude<keyof Fields, "sad">, "sad2">'.
    const EntitySchema = withOpenApiAnnotations(
      Schema.TaggedStruct(entityName, {
        id: EntityIdFromNumberSchema,
        ...otherFields,
      }),
      {
        title: entityTitle,
        description: entityDescription,
      },
    ) as unknown as EntitySchema<EntityName, Fields>

    const EntitySchemaContainer = {
      [`${entityName}Schema`]: EntitySchema,
    } as EntityStructContainer<EntityName, Fields>

    return {
      ...BrandContainer,
      ...EntityIdFromNumberSchemaContainer,
      ...EntityIdFromStringSchemaContainer,
      ...EntitySchemaContainer,
    }
  }
}

export type EntityParts<
  EntityName extends string,
  Fields extends Record<string, Schema.Struct.Field>,
> = BrandContainer<EntityName> &
  EntityIdFromNumberSchemaContainer<EntityName> &
  EntityIdFromStringSchemaContainer<EntityName> &
  EntityStructContainer<EntityName, Fields>

export type BrandContainer<EntityName extends string> = {
  [k in `with${EntityName}IdBrand`]: <SubS extends Schema.Schema.Any>(
    self: SubS,
  ) => Schema.brand<SubS, `${EntityName}Id`>
}

export type IdType<EntityName extends string> = number &
  Brand.Brand<`${EntityName}Id`>

export type IdFromNumberSchema<EntityName extends string> = Schema.Schema<
  IdType<EntityName>,
  number,
  never
>

export type EntitySchema<
  EntityName extends string,
  Fields extends Record<string, Schema.Struct.Field>,
> = EnsureTaggedStructWithStringLiteral<
  Schema.TaggedStruct<
    EntityName,
    { id: IdFromNumberSchema<EntityName> } & Fields
  >,
  never
>

export type EntityIdFromNumberSchemaContainer<EntityName extends string> = {
  [k in `${EntityName}IdFromNumberSchema`]: IdFromNumberSchema<EntityName>
}

export type EntityIdFromStringSchemaContainer<EntityName extends string> = {
  [k in `${EntityName}IdFromStringSchema`]: Schema.Schema<
    IdType<EntityName>,
    string,
    never
  >
}

export type EntityStructContainer<
  EntityName extends string,
  Fields extends Record<string, Schema.Struct.Field>,
> = {
  [k in `${EntityName}Schema`]: EntitySchema<EntityName, Fields>
}
