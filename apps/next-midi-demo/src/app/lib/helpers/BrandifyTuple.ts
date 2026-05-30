export type BrandifyTuple<
  TBrand,
  TTuple extends readonly any[] | [],
> = TTuple extends readonly [
  ...infer TTupleRest extends readonly any[],
  infer Current,
]
  ? readonly [...BrandifyTuple<TBrand, TTupleRest>, TBrand & Current]
  : readonly []
