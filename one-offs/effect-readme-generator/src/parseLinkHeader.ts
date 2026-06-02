import parseLinkHeaderToObject from 'parse-link-header'
import { ZodError, z } from 'zod'

export const LinkHeaderZodSchema = z.object({
  ...getLinkFieldShapeObject('prev'),
  ...getLinkFieldShapeObject('next'),
  ...getLinkFieldShapeObject('last'),
  ...getLinkFieldShapeObject('first'),
})

export type ILinkHeader = z.infer<typeof LinkHeaderZodSchema>

export function parseLinkHeader(linkHeader: string | undefined | null) {
  try {
    return LinkHeaderZodSchema.parse(parseLinkHeaderToObject(linkHeader))
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(
        (error as ZodError<z.infer<typeof LinkHeaderZodSchema>>).format(),
      )
    }
    throw new Error(
      `Failed to parse Link header of the response:\n"${linkHeader}"`,
      { cause: error },
    )
  }
}

function getLinkFieldShapeObject<const T extends string>(name: T) {
  const FieldSchema = z
    .object({
      per_page: z.coerce.number(),
      page: z.coerce.number(),
      rel: z.literal(name),
      direction: z.enum(['asc', 'desc']),
      sort: z.enum(['updated', 'created']),
      url: z.string().url(),
    })
    .strict()
    .optional()

  return { [name]: FieldSchema } as { [k in T]: typeof FieldSchema }
}
