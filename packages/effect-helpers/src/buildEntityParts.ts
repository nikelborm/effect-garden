import type * as Brand from 'effect/Brand'
import * as Schema from 'effect/Schema'

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

const ID = Schema.Int.check(
  Schema.isGreaterThan(0, { examples: [1, 200, 6719] }),
)

// TODO: heavily test
const makeBrandSchema: <S extends Schema.Constraint, B extends string>(
  brand: B,
  annotations?: Schema.Annotations.Bottom<
    S['Type'] & Brand.Brand<B>,
    any
  >,
) => <SubS extends S>(self: SubS) => Schema.brand<SubS, B> =
  Schema.brand as any

// TODO: heavily test
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

    const withEntityIdBrandSchema = makeBrandSchema(EntityId)

    const BrandContainer = {
      [`with${EntityId}Brand`]: withEntityIdBrandSchema,
    } as BrandContainer<EntityName>

    const EntityIdFromNumberSchema = ID.pipe(
      withEntityIdBrandSchema,
      withTitleSchemaAnnotation(idFieldTitle),
      withDescriptionSchemaAnnotation(idFieldDescription),
      withIdsAnnotations(`${EntityId}FromNumber`),
    )

    const EntityIdFromNumberSchemaContainer = {
      [`${EntityId}FromNumberSchema`]: EntityIdFromNumberSchema,
    } as unknown as EntityIdFromNumberSchemaContainer<EntityName>

    const EntityIdFromStringSchema = EntityIdFromNumberSchema.pipe(
      changeEncodedTypeToString,
      withIdsAnnotations(`${EntityId}FromString`),
    )

    const EntityIdFromStringSchemaContainer = {
      [`${EntityId}FromStringSchema`]: EntityIdFromStringSchema,
    } as unknown as EntityIdFromStringSchemaContainer<EntityName>

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
  Fields extends Schema.Struct.Fields,
> = BrandContainer<EntityName> &
  EntityIdFromNumberSchemaContainer<EntityName> &
  EntityIdFromStringSchemaContainer<EntityName> &
  EntityStructContainer<EntityName, Fields>

export type BrandContainer<EntityName extends string> = {
  [k in `with${EntityName}IdBrand`]: <SubS extends Schema.Constraint>(
    self: SubS,
  ) => Schema.brand<SubS, `${EntityName}Id`>
}

export type IdType<EntityName extends string> = Brand.Branded<
  number,
  `${EntityName}Id`
>

export type IdFromNumberSchema<EntityName extends string> = Schema.Codec<
  IdType<EntityName>,
  number
>

export type EntitySchema<
  EntityName extends string,
  Fields extends Schema.Struct.Fields,
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
  [k in `${EntityName}IdFromStringSchema`]: Schema.Codec<
    IdType<EntityName>,
    string
  >
}

export type EntityStructContainer<
  EntityName extends string,
  Fields extends Schema.Struct.Fields,
> = {
  [k in `${EntityName}Schema`]: EntitySchema<EntityName, Fields>
}
