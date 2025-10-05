import { type Equals, assert } from 'tsafe';
import type {
  FullExclusiveJoin,
  FullJoin,
  InnerJoin,
  LeftExclusiveJoin,
  LeftJoin,
  RightExclusiveJoin,
  RightJoin,
} from './types.ts';
import type { _ } from './constants.ts';

const A = Symbol('A');
const B = Symbol('B');
type A = typeof A;
type B = typeof B;



assert<Equals<LeftExclusiveJoin <A, B, 'A'>, [A, _]>>();
assert<Equals<InnerJoin         <A, B, 'A'>, [A, B]>>();
assert<Equals<RightExclusiveJoin<A, B, 'A'>, [_, B]>>();
assert<Equals<LeftJoin          <A, B, 'A'>, [A, B] | [A, _]>>();
assert<Equals<RightJoin         <A, B, 'A'>, [A, B] | [_, B]>>();
assert<Equals<FullExclusiveJoin <A, B, 'A'>, [A, _] | [_, B]>>();
assert<Equals<FullJoin          <A, B, 'A'>, [A, _] | [_, B] | [A, B]>>();


assert<Equals<LeftExclusiveJoin <A, B, 'C'>, [A, _]>>();
assert<Equals<InnerJoin         <A, B, 'C'>, [A, B]>>();
assert<Equals<RightExclusiveJoin<A, B, 'C'>, [_, B]>>();
assert<Equals<LeftJoin          <A, B, 'C'>, [A    , B | _]>>();
assert<Equals<RightJoin         <A, B, 'C'>, [A | _, B    ]>>();
assert<Equals<FullExclusiveJoin <A, B, 'C'>, [A    , _] | [_, B    ]>>();
assert<Equals<FullJoin          <A, B, 'C'>, [A | _, B] | [A, B | _]>>();


assert<Equals<LeftExclusiveJoin <A, B, 'E'>,  [A, _]>>();
assert<Equals<InnerJoin         <A, B, 'E'>,  [A, B]>>();
assert<Equals<RightExclusiveJoin<A, B, 'E'>,  [_, B]>>();
assert<Equals<LeftJoin          <A, B, 'E'>,  [A, B] | [A, _] | [A,     B | _]>>();
assert<Equals<RightJoin         <A, B, 'E'>,  [A, B] | [_, B] | [A | _, B    ]>>();
assert<Equals<FullExclusiveJoin <A, B, 'E'>,  [A, _] | [_, B]>>();
assert<Equals<FullJoin<A, B, 'E'>,
  | [A, B]
  | [A, _]
  | [_, B]
  | [A | _, B    ]
  | [A,     B | _]
>>();


// TODO: add type assertions not only for generics, but to a function call returns
