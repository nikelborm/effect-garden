import { noCase } from 'change-case';
import { capitalize, objectEntries, objectKeys } from 'tsafe';
import { describe, expect, it, test } from 'vitest';
import {
  _,
  joinNameToVennDiagramParts,
  joinNameToVennDiagramPartsWithoutAliases,
} from './constants.ts';
import { getShufflingIterable } from './getShufflingIterable.helper.spec.ts';
import { join } from './joinOnJoinName.ts';
import type {
  AllJoinNames,
  BBA,
  VVA,
  Prettify,
  VennDiagramPartsCombinations,
} from './types.ts';

function getJoinNamesBy<Mask>(
  bitmask: (vennDiagramParts: VennDiagramPartsCombinations) => boolean,
) {
  type JoinNames = Prettify<
    Extract<
      {
        [Key in AllJoinNames]: [Key, (typeof joinNameToVennDiagramParts)[Key]];
      }[AllJoinNames],
      [AllJoinNames, Mask]
    >
  >;
  return new Set(
    objectEntries(joinNameToVennDiagramParts)
      .filter((e): e is JoinNames => bitmask(e[1]))
      .map(e => e[0] as (typeof e)[0]),
  );
}

/**
 * For cases when to filled with data base of A we join empty B, here we collect
 * types of joins that return exclusively VNAs for every row of A ([A, empty])
 * and no other rows
 */
const joinsProducingVNAs = getJoinNamesBy<`1${string}`>(e => e.startsWith('1'));

/**
 * For cases when to empty base of A we join filled with data B, here we collect
 * types of joins that return exclusively NVAs for every row of B ([empty, B])
 * and no other rows
 */
const joinsProducingNVAs = getJoinNamesBy<`${string}1`>(e => e.endsWith('1'));

/**
 * Allows arrays of values pass equality tests regardless of order of elements,
 * but still requires all values (even duplicates) to be present in the same
 * amount as before
 */
const toUnorderedSet = <T>(iterable: Iterable<T>) =>
  new Set(Array.from(iterable, v => [v] as [T]));

type Side = { status: string };
const renderSuiteName = (a: Side, b: Side, joinName: string) =>
  [
    /* 'Empty ' */ capitalize(a.status).padEnd(6),
    'Array<A>',
    /* 'left joined    ' */ noCase(joinName + 'ed').padStart(17),
    'with',
    /* 'filled' */ b.status.padEnd(6),
    'Array<B>',
  ].join(' ');

export const testSuiteForAllJoins = <L, R, MergeResult>(
  suiteName: string,
  passesJoinCondition: (tuple: VVA<L, R>) => boolean,
  merge: (tuple: BBA<L, R>) => MergeResult,
  {
    a: aNotShuffled,
    b: bNotShuffled,
  }: {
    a: Iterable<L>;
    b: Iterable<R>;
  },
  joinResultForBothFilledDatasets: Record<
    keyof typeof joinNameToVennDiagramPartsWithoutAliases,
    Iterable<NoInfer<MergeResult>>
  >,
) => {
  const a = getShufflingIterable(aNotShuffled);
  const b = getShufflingIterable(bNotShuffled);
  const render = <const S, V>(status: S, value: V) => ({ status, value });

  const split = <T>(i: number, divisor: number, value: Iterable<T>) =>
    i & divisor ? render('empty', []) : render('filled', value);

  describe.for(
    objectKeys(joinResultForBothFilledDatasets).flatMap(joinName =>
      [
        joinResultForBothFilledDatasets[joinName],
        Array.from(joinsProducingVNAs.has(joinName) ? a : [], e =>
          merge([e, _]),
        ),
        Array.from(joinsProducingNVAs.has(joinName) ? b : [], e =>
          merge([_, e]),
        ),
        [],
      ].map((expectedResult, i) => ({
        joinName,
        a: split(i, 2, a),
        b: split(i, 1, b),
        expectedResult,
      })),
    ),
  )(suiteName, ({ joinName, a, b, expectedResult }) => {
    const localJoin = (joinConditionFn?: (...args: any[]) => unknown) =>
      // @ts-expect-error it's expected of ts reporting an error related to joinName being too wide
      join(a.value, b.value, joinName, merge, joinConditionFn);

    describe(renderSuiteName(a, b, joinName), () => {
      it('Throws    ', () =>
        expect(() =>
          localJoin(joinName === 'crossJoin' ? passesJoinCondition : void 0),
        ).toThrow());

      const getJoinResult = () =>
        localJoin(joinName === 'crossJoin' ? void 0 : passesJoinCondition);

      const initialResult = toUnorderedSet(getJoinResult());

      test('Correct   ', () =>
        expect(initialResult).toStrictEqual(toUnorderedSet(expectedResult)));

      test('Consistent', () =>
        expect(toUnorderedSet(getJoinResult())).toStrictEqual(initialResult));
    });
  });
};
