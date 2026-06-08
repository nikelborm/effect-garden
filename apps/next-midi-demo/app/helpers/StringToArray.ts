export type StringToArray<T extends string> =
  T extends `${infer Character}${infer Rest}`
    ? [Character, ...StringToArray<Rest>]
    : []
