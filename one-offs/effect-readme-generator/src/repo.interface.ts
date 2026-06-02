import { z } from 'zod'

export const RepoZodSchema = z
  .object({
    name: z.string(),
    owner: z.string(),
    starCount: z.number(),
    forkCount: z.number(),
    isItArchived: z.boolean(),
    isTemplate: z.boolean(),
    lastTimeBeenPushedInto: z.union([z.coerce.date(), z.null()]),
  })
  .strict()

export type IRepo = z.infer<typeof RepoZodSchema>
export type IMiniRepo = Pick<IRepo, 'owner' | 'name'>
