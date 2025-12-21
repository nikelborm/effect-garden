// TODO: When I'll finish this shit, post it to https://github.com/type-challenges/type-challenges
// TODO: Also replace bad Merge implementation in https://github.com/sindresorhus/type-fest/blob/main/source/merge.d.ts with a new one made by me

// TODO: compare it with MergeRight from effect-smol
// https://github.com/Effect-TS/effect-smol/blob/99ecec8d9d8ab69392855e444bb82dfe1cd9aba4/packages/effect/src/types/Types.ts#L217
// Maybe move some of my tests there

// TODO: compare with https://github.com/poteat/scopey since it uses merging by overriding fields

// import type { Merge as MagicGeneric } from 'type-fest';
import type { At as GetNthCharacter } from 'ts-toolbelt/out/String/At.d.ts'
import type { BBA, ForbiddenLiteralUnion, VNA, NVA } from './types.ts'
import type { PreserveUndefinedOnlyIfWasExplicit } from './PreserveUndefinedOnlyIfWasExplicit.ts'

function doesAHavePriority(
  mergeStrategy: '{ ...B, ...A }' | '{ ...A, ...B }',
): mergeStrategy is '{ ...B, ...A }' {
  const firstPriorityIndex = 11
  return (
    (mergeStrategy[firstPriorityIndex] as GetNthCharacter<
      typeof mergeStrategy,
      typeof firstPriorityIndex
    >) === 'A'
  )
}

export const getSpreadObjectMerger =
  <const MergeStrategy extends '{ ...B, ...A }' | '{ ...A, ...B }'>(
    mergeStrategy: MergeStrategy,
  ) =>
  <const T extends BBA<Object, Object>>(tuple: T) => {
    const AHasPriority = doesAHavePriority(mergeStrategy)
    type TupleIndex = 0 | 1
    const castToObject = (index: TupleIndex) => {
      if (typeof tuple[index] !== 'object' || tuple[index] === null)
        throw new Error('getSpreadObjectMerger handles objects exclusively')
      return tuple[index]
    }

    return {
      ...castToObject(+AHasPriority as TupleIndex),
      ...castToObject(+!AHasPriority as TupleIndex),
    } as T extends NVA<never, infer B>
      ? B
      : T extends VNA<infer A, never>
        ? A
        : T extends BBA<infer A, infer B> // TODO: check this `extends` because it's SUS AF
          ? [MergeStrategy] extends ['{ ...A, ...B }']
            ? MagicGeneric<A, B>
            : [MergeStrategy] extends ['{ ...B, ...A }']
              ? MagicGeneric<B, A>
              : ForbiddenLiteralUnion<'MergeStrategy', 'getSpreadObjectMerger'>
          : `getSpreadObjectMerger('${MergeStrategy}') function received invalid tuple type as an argument`
  }

type CommonKey<L, R> = keyof L & keyof R

type MagicGenericMergedBodyForCommonKey<
  L,
  R,
  Key extends CommonKey<L, R>,
> = R extends { [K in Key]: R[Key] }
  ? R[Key]
  :
      | PreserveUndefinedOnlyIfWasExplicit<R, Key>
      | PreserveUndefinedOnlyIfWasExplicit<L, Key>

type OptionalKeyof<T> = Exclude<
  {
    [Key in keyof T]: T extends Record<Key, T[Key]> ? never : Key
  }[keyof T],
  undefined
>

type BothOptionalKeys<L, R> = OptionalKeyof<L> & OptionalKeyof<R>

// TODO: find better name instead of MagicGeneric
// TODO: God please don't tell me this shit breaks also readonly modifiers
// on fields 😭😭😭
// It's intentionally not just (L & R) because we need a way to reliably
// specify that properties from right if exist, override properties from
// left
export type MagicGeneric<L, R /* R has higher priority */> = {
  [Key in Exclude<
    CommonKey<L, R>,
    BothOptionalKeys<L, R>
  >]-?: MagicGenericMergedBodyForCommonKey<L, R, Key>
} & {
  [Key in BothOptionalKeys<L, R>]+?: MagicGenericMergedBodyForCommonKey<
    L,
    R,
    Key
  >
} & Omit<L, keyof R> &
  Omit<R, keyof L>
