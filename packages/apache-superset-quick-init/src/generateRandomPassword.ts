import { randomFill } from 'node:crypto'
import { promisify } from 'node:util'
import { promise } from 'effect/Effect'

const randomFillAsync = promisify(randomFill)

export const generateRandomPassword = promise(async () => {
  const buffer = Buffer.alloc(48)
  await randomFillAsync(buffer)
  return buffer.toString('base64')
})
