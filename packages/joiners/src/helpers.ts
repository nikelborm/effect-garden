import { _ } from './constants.ts'

import type { BBA, VNC,  } from './types.ts'

export function isEmpty<T>(v: T): v is T & _ {
  return v === _
}

export function isNotEmpty<T>(v: T): v is Exclude<T, _> {
  return v !== _
}

// export function castToBBA<tup extends [unknown, unknown]>(
//   lr: tup,
// ): asserts lr is BBA<tup[0], tup[1]> {
//   // TODO: check l is L and r is R?

//   const [l, r] = lr

//   if (isEmpty(l) && isEmpty(r))
//     throw new Error(
//       `Error: What the actual fuck??? Failed to cast to BBA because left is empty and right is empty too.`,
//     )
// }
