import { equal } from 'assert';
import type { List } from "ts-toolbelt"
import test from 'node:test';

function logObjectNicely(item: any): void {
  console.dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });
}


function testXorComparator(
  name: string,
  comparator: (a: boolean, b: boolean) => boolean,
) {
  test(name, () => {
    equal(comparator(false, false), false)
    equal(comparator(false, true),  true )
    equal(comparator(true,  false), true )
    equal(comparator(true,  true),  false)
  })
}

testXorComparator('original xor', (a, b) => a !== b)

testXorComparator('1st custom xor using: !, &&    ', (a, b) => !(a && b) && !(!a && !b)) // 7 ops
testXorComparator('2nd custom xor using: !, &&    ', (a, b) => !( !(a && !b) && !(!a && b) )) // 8 ops

testXorComparator('1st custom xor using: !, &&, ||', (a, b) => !(a && b) && (a || b)) // 4 ops
testXorComparator('2nd custom xor using: !, &&, ||', (a, b) => (a && !b) || (!a && b)) // 5 ops
testXorComparator('3rd custom xor using: !, &&, ||', (a, b) => !( (a && b) || !(a || b) )) // 5 ops
testXorComparator('4th custom xor using: !, &&, ||', (a, b) => (!a || !b) && (a || b)) // 5 ops
testXorComparator('5th custom xor using: !, &&, ||', (a, b) => !( (a && b) || (!a && !b) )) // 6 ops

testXorComparator('1st custom xor using: !, ||', (a, b) => !( !(!a || !b) || !(a || b) )) // 8 ops


test('testMulti', () => {
  const k = 2;
  const operation = (a: number, b: number) => a | b;

  for (let i = 0; i < 2 ** k; i++) {
    let temp = i & 1;
    for (let j = 1; j < k; j++) {
      temp = operation(temp, ~~!!(i & (2 ** j)))
    }
    // console.log(i.toString(2).padStart(k, '0'), temp)
  }
});


function testFunctionOnAllParameters<
  const Length extends number
>(
  functionParameters: Length,
  debug: boolean,
  func1: (...args: List.Repeat<boolean, NoInfer<Length>>) => boolean,
  func2: (...args: List.Repeat<boolean, NoInfer<Length>>) => boolean,
) {
  test(`testFunctionOnAllParameters: ${functionParameters}, ${func1}, ${func2}`, () => {
    for (let i = 0; i < 2 ** functionParameters; i++) {
      const args = [] as boolean[];
      for (let j = 0; j < functionParameters; j++) {
        args.push(!!(i & (2 ** j)))
      }
      const res1 = func1.apply(null, args)
      const res2 = func2.apply(null, args)
      if (debug) console.log(
        `${args.map(e => ~~e).join(', ')} => ${~~res1}, ${~~res2}`
      );
      equal(
        res1,
        res2,
        `func1, func2 => ${res1}, ${res2}; args=[${args.join(', ')}]`
      )
    }
  })
}

testFunctionOnAllParameters(
  4,
  false,
  (A, B, C, D) => (A || B || C) && D,
  (A, B, C, D) => (A && D)
               || (B && D)
               || (C && D),
);


testFunctionOnAllParameters(
  6,
  false,
  (A, B, C, D, E, F) => (A || B || C) && (D || E || F),
  (A, B, C, D, E, F) => (A && D) || (A && E) || (A && F) ||
                        (B && D) || (B && E) || (B && F) ||
                        (C && D) || (C && E) || (C && F)
);

testFunctionOnAllParameters(
  6,
  false,
  (A, B, C, D, E, F) => (A && B && C) || (D && E && F),
  (A, B, C, D, E, F) => !(!(A && B && C) && !(D && E && F))
);

testFunctionOnAllParameters(
  3,
  false,
  (A, B, C) => !(A && B && C),
  (A, B, C) => !A || !B || !C,
);
