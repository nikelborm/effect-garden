import type { Add, Divide, Multiply, Subtract } from 'type-plus'

export const multiply = <const A extends number, const B extends number>(
  a: A,
  b: B,
) => (a * b) as Multiply<A, B>

export const substract = <const A extends number, const B extends number>(
  a: A,
  b: B,
) => (a - b) as Subtract<A, B>

export const add = <const A extends number, const B extends number>(
  a: A,
  b: B,
) => (a + b) as Add<A, B>

export const divide = <const A extends number, const B extends number>(
  a: A,
  b: B,
) => (a / b) as Divide<A, B>
