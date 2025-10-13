import { _ } from './constants.ts'

import type { BBA, VNC, ToBBA, ToV, To_ } from './types.ts'

export function isEmpty<T>(v: T): v is To_<T> {
  return v === _
}

export function isNotEmpty<T>(v: T): v is ToV<T> {
  return v !== _
}

export function castToBBA<tup extends [unknown, unknown]>(
  lr: tup,
): asserts lr is ToBBA<L, R> {
  // TODO: check l is L and r is R?

  const [l, r] = lr

  if (isEmpty(l) && isEmpty(r))
    throw new Error(
      `Error: What the actual fuck??? Failed to cast to BBA because left is empty and right is empty too.`,
    )
}

let asdf = [12, _] as VNC<12, string>

castToBBA([123, 123])
