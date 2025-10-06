import { capitalize } from 'tsafe';

type TupleOfEntriesWithIndexesMappedToValues<
  SourceTuple extends unknown[],
  ResultEntriesTuple extends [unknown, number][] = [],
> = ResultEntriesTuple['length'] extends SourceTuple['length']
  ? ResultEntriesTuple
  : TupleOfEntriesWithIndexesMappedToValues<
      SourceTuple,
      [
        ...ResultEntriesTuple,
        [
          SourceTuple[ResultEntriesTuple['length']],
          ResultEntriesTuple['length'],
        ],
      ]
    >;

type GetUnionOfTuplesHavingValuesAndTheirIndexes<
  SourceTuple extends unknown[],
> = (SourceTuple extends any
  ? TupleOfEntriesWithIndexesMappedToValues<SourceTuple> extends infer T extends
      unknown[]
    ? T[number]
    : never
  : never) &
  [unknown, number];

type BundleBack<
  UnionOfEntries extends [unknown, number],
  ResultTuple extends unknown[] = [],
  ExtendableTupleJustForIteration extends 1[] = [],
> = [UnionOfEntries] extends [never]
  ? ResultTuple
  : BundleBack<
      Exclude<
        UnionOfEntries,
        [unknown, ExtendableTupleJustForIteration['length']]
      >,
      Extract<
        UnionOfEntries,
        [unknown, ExtendableTupleJustForIteration['length']]
      > extends infer U extends [unknown, number]
        ? [U] extends [never]
          ? ResultTuple
          : [...ResultTuple, U[0]]
        : never,
      [...ExtendableTupleJustForIteration, 1]
    >;

type CastableToString = string | number | bigint | boolean | null | undefined;

type Join<
  UnionOfEntries extends [CastableToString, number],
  Separator extends string,
  ResultString extends string = '',
  ExtendableTupleJustForIteration extends 1[] = [],
> = [UnionOfEntries] extends [never]
  ? ResultString
  : Join<
      Exclude<
        UnionOfEntries,
        [CastableToString, ExtendableTupleJustForIteration['length']]
      >,
      Separator,
      Extract<
        UnionOfEntries,
        [CastableToString, ExtendableTupleJustForIteration['length']]
      > extends infer U extends [CastableToString, number]
        ? [U] extends [never]
          ? ResultString
          : U extends [unknown, 0]
            ? `${U[0]}`
            : `${ResultString}${Separator}${U[0]}`
        : never,
      [...ExtendableTupleJustForIteration, 1]
    >;

type sadadsds = BundleBack<['asd', 0] | ['sdf', 1]>;
//   ^ ["asd", "sdf"]

type sadadsds2 = BundleBack<
  ['0', 0] | ['2', 2] | ['4', 6] | ['6', 4] | ['5', 4]
>;
//   ^ ["0", "2", "6" | "5", "4"]

type sadadsds3 = Join<
  ['0', 0] | ['2', 2] | ['4', 6] | ['6', 4] | ['5', 4],
  ', '
>;
//   ^  "0, 2, 5, 4" | "0, 2, 6, 4"

type OneConcatArg = unknown[] | { rawTuple: unknown[] };

type Concat<T extends OneConcatArg[]> = T extends [
  infer U extends OneConcatArg,
  ...infer Rest extends OneConcatArg[],
]
  ? [
      ...([U] extends [unknown[]]
        ? U
        : [U] extends [{ rawTuple: infer K extends unknown[] }]
          ? K
          : never),
      ...Concat<Rest>,
    ]
  : [];

export type Prettify<T> = { [P in keyof T]: T[P] } & {};

// TODO: respond to https://github.com/Microsoft/TypeScript/issues/26223#issuecomment-410847836 when I finish this

// TODO: add validation of indexes
// 1. map should return all the indexes present in source array: no more, no less
// 2. filter should not return indexes that were not present in source array
// 3. there should not be duplicated indexes
// etc...

// TODO: implement "pop" | "push" | "reverse" | "shift"
// | "slice" | "sort" | "splice" | "unshift" | "indexOf" | "lastIndexOf" |
// "every" | "some" | "forEach" | "reduce" | "reduceRight" |
// "find" | "findIndex" | "fill" | "copyWithin" | "entries" | "keys" |
// "values" | "includes" | "flatMap" | "flat" | "at" | "findLast" |
// "findLastIndex" | "toReversed" | "toSorted" | "toSpliced" | "with"

// The list above inspired by type of asds
// `declare const asds: Prettify<Exclude<keyof [], 'map'>>;`

class BetterTuple<
  const SourceTuple extends unknown[],
  UnionOfTuplesHavingValuesAndTheirIndexes extends
    GetUnionOfTuplesHavingValuesAndTheirIndexes<SourceTuple> = GetUnionOfTuplesHavingValuesAndTheirIndexes<SourceTuple>,
  // Enumeration extends Enumerate<Tuple> = Enumerate<Tuple>
> {
  constructor(rawTuple: SourceTuple) {
    this.rawTuple = rawTuple;
  }

  public readonly rawTuple: SourceTuple;

  map<U>(
    callbackfn: (
      valueWithIndex: UnionOfTuplesHavingValuesAndTheirIndexes,
      array: SourceTuple
    ) => U
  ) {
    const returns = [];
    for (let index = 0; index < this.rawTuple.length; index++) {
      returns.push(
        callbackfn([this.rawTuple[index], index] as any, this.rawTuple)
      );
    }
    return new BetterTuple(returns as BundleBack<U & [unknown, number]>);
  }

  filter<U extends UnionOfTuplesHavingValuesAndTheirIndexes>(
    predicate: (
      valueWithIndex: UnionOfTuplesHavingValuesAndTheirIndexes,
      array: SourceTuple
    ) => valueWithIndex is U
  ) {
    const returns = [];
    for (let index = 0; index < this.rawTuple.length; index++) {
      if (predicate([this.rawTuple[index], index] as any, this.rawTuple))
        returns.push(this.rawTuple[index]);
    }
    return new BetterTuple(returns as BundleBack<U>);
  }

  join<const Separator extends string>(separator?: Separator) {
    return this.rawTuple.join(separator) as [
      UnionOfTuplesHavingValuesAndTheirIndexes,
    ] extends [[CastableToString, number]]
      ? Join<UnionOfTuplesHavingValuesAndTheirIndexes, Separator>
      : string;
  }

  concat<const T extends OneConcatArg[]>(...items: T) {
    return new BetterTuple(
      this.rawTuple.concat(
        ...items.map((e) => (e instanceof BetterTuple ? e.rawTuple : e))
      ) as Concat<[SourceTuple, ...T]>
    );
  }

  get length() {
    return this.rawTuple.length as SourceTuple['length'];
  }
}

const preserveOnlyNormalFruits = <const T extends [unknown, number]>(
  tupleOfValueAndIndex: T
): tupleOfValueAndIndex is Extract<
  T,
  [{ name: string; color: string }, number]
> => {
  const [value] = tupleOfValueAndIndex;
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value['name'] === 'string' &&
    'color' in value &&
    typeof value['color'] === 'string'
  );
};

const fruits = [
  {
    name: 'apple',
    color: 'red',
  },
  {
    name: 'pear',
    color: 'yellow',
  },
  {
    name: 'fruit_with_bad_color',
    colorFF: 'q8974234by73wo8uhie',
  },
  {
    name: 'watermelon',
    color: 'green',
  },
  {
    nameDDDD: '3298vbyw4v3eouh',
    color: 'asibdu8q3ovihaueuwi',
  },
] as const satisfies unknown[];

const asd1 = new BetterTuple(fruits).map(
  <T extends [unknown, number], U>(t: T) =>
    [
      preserveOnlyNormalFruits(t)
        ? `${capitalize(t[0]['name'])} has ${t[0]['color']} color`
        : `broken object at index ${t[1]}`,
      t[1],
      // hint to distribute the type is needed here, so this `extends` has 2
      // roles at the same time. It runs the check AND distributes the type
    ] as T extends [{ name: string; color: string }, number]
      ? [`${Capitalize<T[0]['name']>} has ${T[0]['color']} color`, T[1]]
      : [`broken object at index ${T[1]}`, T[1]]
).rawTuple;
// Correctly inferred type (and value) should be
// const asd1: [
//   "Apple has red color",
//   "Pear has yellow color",
//   "broken object at index 2",
//   "Watermelon has green color",
//   "broken object at index 4"
// ]

const asd2 = new BetterTuple(asd1).filter(
  (
    tuple
  ): tuple is Exclude<
    typeof tuple,
    [`broken object at index ${string}`, number]
  > => !tuple[0].startsWith('broken object at index ')
).rawTuple;
// Correctly inferred type (and value) should be
// const asd2: [
//   "Apple has red color",
//   "Pear has yellow color",
//   "Watermelon has green color",
// ]

const asd3 = new BetterTuple(fruits)
  .map(
    <T extends [unknown, number], U>(t: T) =>
      [
        preserveOnlyNormalFruits(t)
          ? `${capitalize(t[0]['name'])} has ${t[0]['color']} color`
          : `broken object at index ${t[1]}`,
        t[1],
        // hint to distribute the type is needed here, so this `extends` has 2
        // roles at the same time. It runs the check AND distributes the type
      ] as T extends [{ name: string; color: string }, number]
        ? [`${Capitalize<T[0]['name']>} has ${T[0]['color']} color`, T[1]]
        : [`broken object at index ${T[1]}`, T[1]]
  )
  .filter(
    (
      v_i
    ): v_i is Exclude<
      typeof v_i,
      [`broken object at index ${string}`, number]
    > => !v_i[0].startsWith('broken object at index ')
  ).rawTuple;

// Correctly inferred type (and value) should be
// const asd3: [
//   "Apple has red color",
//   "Pear has yellow color",
//   "Watermelon has green color",
// ]

// `extends ...` is a hint to distribute the type
type StringViewOfFruit<V_I> = V_I extends [
  { name: string; color: string },
  number,
]
  ? [`${Capitalize<V_I[0]['name']>} has ${V_I[0]['color']} color`, V_I[1]]
  : never;

const asd4 = new BetterTuple(fruits).filter(preserveOnlyNormalFruits).map(
  (v_i) =>
    [
      `${capitalize(v_i[0]['name'])} has ${v_i[0]['color']} color`,
      v_i[1],
      // hint to distribute the type is required here
    ] as StringViewOfFruit<typeof v_i>
).rawTuple;

// Correctly inferred type (and value) should be
// const asd4: [
//   "Apple has red color",
//   "Pear has yellow color",
//   "Watermelon has green color",
// ]

const asd5 = new BetterTuple(fruits)
  .filter(preserveOnlyNormalFruits)
  .map(
    <T extends [{ name: string; color: string }, number]>(v_i: T) =>
      // hint to distribute the type is required here
      [v_i[0]['name'], v_i[1]] as T extends any ? [T[0]['name'], T[1]] : never
  )
  .join(', ');

// Correctly inferred type (and value) should be
// const asd5: "apple, pear, watermelon"

const asd6 = new BetterTuple(fruits)
  .filter(preserveOnlyNormalFruits)
  .join(', ');

// Generally inferred type (and value) should be
// const asd6: string
// Because it can't cast objects to string in type-system

const asd7 = new BetterTuple(fruits)
  .concat(fruits, new BetterTuple(fruits))
  .filter(
    (tuple): tuple is Extract<typeof tuple, [{ name: string }, number]> =>
      'name' in tuple[0] && typeof tuple[0].name === 'string'
  )
  .map(
    <T extends [{ name: string }, number]>(v_i: T) =>
      // hint to distribute the type is required here
      [v_i[0]['name'], v_i[1]] as T extends any ? [T[0]['name'], T[1]] : never
  )
  .join(', ');

// Inferred type (and value) should be
// const asd6: "apple, pear, fruit_with_bad_color, watermelon, apple, pear, fruit_with_bad_color, watermelon, apple, pear, fruit_with_bad_color, watermelon"
