import { test } from 'vitest';
import { join } from './joinOnJoinName.ts';
import { joinOnVennDiagramParts } from './joinOnVennDiagramParts.ts';
import { getSpreadObjectMerger } from './spreadObjectMerger.ts';

const brandA = Symbol('A');
const brandB = Symbol('B');

type A1 = {
  brand: typeof brandA;
  id: number;
  v: number;
  optionalColumnSpecificToTypeA?: typeof brandA;
  requiredColumnSpecificToTypeA: typeof brandA;
  optionalColumnTypeAgnostic?: typeof brandA;
  requiredColumnTypeAgnostic: typeof brandA;
};

type B1 = {
  brand: typeof brandB;
  id: number;
  v: number;
  optionalColumnSpecificToTypeB?: typeof brandB;
  requiredColumnSpecificToTypeB: typeof brandB;
  optionalColumnTypeAgnostic?: typeof brandB;
  requiredColumnTypeAgnostic: typeof brandB;
};

const asIsMerger = <const T>(t: T): T => t;

// prettier-ignore
const left = new Set<A1>([
  { brand: brandA, id: 1, v: 6, requiredColumnSpecificToTypeA: brandA, requiredColumnTypeAgnostic: brandA },
  { brand: brandA, id: 2, v: 6, requiredColumnSpecificToTypeA: brandA, requiredColumnTypeAgnostic: brandA },
  { brand: brandA, id: 3, v: 7, requiredColumnSpecificToTypeA: brandA, requiredColumnTypeAgnostic: brandA },
  { brand: brandA, id: 4, v: 7, requiredColumnSpecificToTypeA: brandA, requiredColumnTypeAgnostic: brandA },
  { brand: brandA, id: 5, v: 9, requiredColumnSpecificToTypeA: brandA, requiredColumnTypeAgnostic: brandA }
])

// prettier-ignore
const right = new Set<B1>([
  { brand: brandB, id: 1, v: 7 , requiredColumnSpecificToTypeB: brandB, requiredColumnTypeAgnostic: brandB },
  { brand: brandB, id: 2, v: 7 , requiredColumnSpecificToTypeB: brandB, requiredColumnTypeAgnostic: brandB },
  { brand: brandB, id: 3, v: 8 , requiredColumnSpecificToTypeB: brandB, requiredColumnTypeAgnostic: brandB },
  { brand: brandB, id: 4, v: 8 , requiredColumnSpecificToTypeB: brandB, requiredColumnTypeAgnostic: brandB },
  { brand: brandB, id: 5, v: 10, requiredColumnSpecificToTypeB: brandB, requiredColumnTypeAgnostic: brandB }
]);

test("whole thing doesn't crash", () => {
  for (const currentMergedTuple of join(left, right, 'crossJoin', asIsMerger)) {
    console.log(currentMergedTuple);
    //          ^? [A1, B1]
  }

  for (const currentMergedTuple of joinOnVennDiagramParts(
    left,
    right,
    '111',
    getSpreadObjectMerger('{ ...A, ...B }'),
    tuple => tuple[0].v === tuple[1].v,
  )) {
    console.log(currentMergedTuple);
    // A1 | {
    //   brand: typeof brandB;
    //   id: number;
    //   v: number;
    //   optionalColumnSpecificToTypeB?: typeof brandB;
    //   requiredColumnSpecificToTypeB: typeof brandB;
    //   optionalColumnTypeAgnostic?: typeof brandB;
    //   requiredColumnTypeAgnostic: typeof brandB;
    // } | {
    //   brand: typeof brandB;
    //   id: number;
    //   v: number;
    //   requiredColumnTypeAgnostic: typeof brandB;
    //   TODO: investigate why the fuck are you required here
    //   optionalColumnTypeAgnostic: typeof brandA | typeof brandB | undefined;
    //   optionalColumnSpecificToTypeA?: typeof brandA;
    //   requiredColumnSpecificToTypeA: typeof brandA;
    //   optionalColumnSpecificToTypeB?: typeof brandB;
    //   requiredColumnSpecificToTypeB: typeof brandB;
    // }
  }
});
