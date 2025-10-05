import type { _, joinNameToVennDiagramParts, joinNameToVennDiagramPartsWithoutAliases } from './constants.ts';
import { type Equals, assert } from 'tsafe';
import type { TuplifyUnion } from './TuplifyUnion.ts';


export type AllJoinNames = keyof typeof joinNameToVennDiagramParts;
export type AllJoinNamesWithoutAliases =
  keyof typeof joinNameToVennDiagramPartsWithoutAliases;

// TODO: define errors as unique symbol consts and return them from generic

export type Prettify<T> = { [P in keyof T]: T[P] } & {};
export type UnSet<T> = T extends Set<infer U> ? U : never;

// it's intentionally [Something] extends ['___'] so that if union of
// Something is passed, generic won't ignore all elements except the first
// element of the union. Generic will reject the whole union and throw
// error
export type ForbiddenLiteralUnion<
  Argument extends string,
  OfTypeName extends string
> =
  `Argument ${Argument} of ${
    OfTypeName
  }<...> accepts only single string literal and can't be union.`
;


/**
 * It's an element of a tuple, either Left or right
 * - N - No element(empty/_). The element of the tuple is _
 * - V - An element(value)  . The element of the tuple is V
 * - B - Both               . The element of the tuple is (_ | V)
 */
type TupleStructureCodePart = 'N' | 'V' | 'B';

/**
 * It's the 1st letter, representing the first element of the tuple (index=`0`)
 */
export type LeftTupleStructureCodePart = TupleStructureCodePart

/**
 * It's the 2nd letter, representing the second element of the tuple (index=`1`)
 */
export type RightTupleStructureCodePart = TupleStructureCodePart

// 3rd letter

/**
 * This union represents 3 possible characteristics that can describe a certain
 * tuple. Each characteristic has a name and according short single letter
 * version.
 *
 * **1. `A` stands for `Atomic`.**
 *
 * These types represent either a single primitive tuple (e.g. `[L, R]`, `[_,
 * R]`, `[L, _]`) or a distributed union of them (e.g. `[L, R] | [_, R]`).
 * Distributed means that in each of the two slots of a tuple there will be no
 * unions of _ (emptiness) and value (L or R, depending on the position inside a
 * tuple). There will be either one or the other.
 *
 * **2. `C` stands for `Compact`.**
 *
 * These types try to be as dense as possible. They can be a result of combining
 * atoms, but instead of being distributed, they try to pack unions of atomic
 * tuples with different values at some slot into a single tuple with a union of
 * different values at that slot. E.g. union of atoms `[L, R] | [_, R]` is
 * represented by Compact tuple `[_ | L, R]`. Slot inside of a compact tuple
 * will have either a union of emptiness and value, or something of those 2.
 *
 * **3. `E` stands for `Expanded`.**
 *
 * A union of all possible representations of tuple, the union of both according
 * Atomic and Compact types.
 */
export type LevelOfDetailModifier = 'A' | 'C' | 'E';

// ATOMS
export type VNA<L, R> = ResolveUnionOfTuples<L, R, 'VNA'>
export type NVA<L, R> = ResolveUnionOfTuples<L, R, 'NVA'>
export type VVA<L, R> = ResolveUnionOfTuples<L, R, 'VVA'>

export type VBA<L, R> = ResolveUnionOfTuples<L, R, 'VBA'>
export type BVA<L, R> = ResolveUnionOfTuples<L, R, 'BVA'>
export type BBA<L, R> = ResolveUnionOfTuples<L, R, 'BBA'>

// COMPACTED
export type VNC<L, R> = ResolveUnionOfTuples<L, R, 'VNC'>
export type NVC<L, R> = ResolveUnionOfTuples<L, R, 'NVC'>
export type VVC<L, R> = ResolveUnionOfTuples<L, R, 'VVC'>

export type VBC<L, R> = ResolveUnionOfTuples<L, R, 'VBC'>
export type BVC<L, R> = ResolveUnionOfTuples<L, R, 'BVC'>
export type BBC<L, R> = ResolveUnionOfTuples<L, R, 'BBC'>

// EXPANDED
export type VNE<L, R> = ResolveUnionOfTuples<L, R, 'VNE'>
export type NVE<L, R> = ResolveUnionOfTuples<L, R, 'NVE'>
export type VVE<L, R> = ResolveUnionOfTuples<L, R, 'VVE'>

export type VBE<L, R> = ResolveUnionOfTuples<L, R, 'VBE'>
export type BVE<L, R> = ResolveUnionOfTuples<L, R, 'BVE'>
export type BBE<L, R> = ResolveUnionOfTuples<L, R, 'BBE'>


type AliasLookupTable = {
  // Atomic
  'VNA': 'VNA'; // Leaf Combinatorial part
  'NVA': 'NVA'; // Leaf Combinatorial part
  'VVA': 'VVA'; // Leaf Combinatorial part

  'VBA': 'VNA' | 'VVA';
  'BVA': 'NVA' | 'VVA';
  'BBA': 'VNA' | 'NVA' | 'VVA';

  // Compact
  'VNC': 'VNA';
  'NVC': 'NVA';
  'VVC': 'VVA';

  'VBC': 'VBC'; // Leaf Combinatorial part
  'BVC': 'BVC'; // Leaf Combinatorial part
  'BBC': 'VBC' | 'BVC';

  // Expanded
  'VNE': 'VNA';
  'NVE': 'NVA';
  'VVE': 'VVA';

  'VBE': 'VBA' | 'VBC'
  'BVE': 'BVA' | 'BVC'
  'BBE': 'BBA' | 'BBC'
};


export type ResolveAliasOnce<
  CombUnion extends TupleStructureCodeToDetailingModifierCombinations
> = AliasLookupTable[CombUnion];

export type ResolveAliasFullyRecursively<
  CombUnion extends TupleStructureCodeToDetailingModifierCombinations
> = CombUnion extends CombinatorialTupleStructureCode
  ? CombUnion
  : ResolveAliasFullyRecursively<AliasLookupTable[CombUnion]>;

assert<Equals<ResolveAliasFullyRecursively<'VNA'>, 'VNA'>>;
assert<Equals<ResolveAliasFullyRecursively<'NVA'>, 'NVA'>>;
assert<Equals<ResolveAliasFullyRecursively<'VVA'>, 'VVA'>>;
assert<Equals<ResolveAliasFullyRecursively<'VBA'>, 'VVA' | 'VNA'>>;
assert<Equals<ResolveAliasFullyRecursively<'BVA'>, 'NVA' | 'VVA'>>;
assert<Equals<ResolveAliasFullyRecursively<'BBA'>, 'VNA' | 'NVA' | 'VVA'>>;
assert<Equals<ResolveAliasFullyRecursively<'VNC'>, 'VNA'>>;
assert<Equals<ResolveAliasFullyRecursively<'NVC'>, 'NVA'>>;
assert<Equals<ResolveAliasFullyRecursively<'VVC'>, 'VVA'>>;
assert<Equals<ResolveAliasFullyRecursively<'VBC'>, 'VBC'>>;
assert<Equals<ResolveAliasFullyRecursively<'BVC'>, 'BVC'>>;
assert<Equals<ResolveAliasFullyRecursively<'BBC'>, 'BVC' | 'VBC'>>;
assert<Equals<ResolveAliasFullyRecursively<'VNE'>, 'VNA'>>;
assert<Equals<ResolveAliasFullyRecursively<'NVE'>, 'NVA'>>;
assert<Equals<ResolveAliasFullyRecursively<'VVE'>, 'VVA'>>;
assert<Equals<ResolveAliasFullyRecursively<'VBE'>, 'VVA' | 'VNA' | 'VBC'>>;
assert<Equals<ResolveAliasFullyRecursively<'BVE'>, 'VVA' | 'NVA' | 'BVC'>>;
assert<Equals<ResolveAliasFullyRecursively<'BBE'>, 'VNA' | 'NVA' | 'VVA' | 'VBC' | 'BVC'>>;

type CombinatorialTupleStructureCode = 'VNA' | 'NVA' | 'VVA' | 'VBC' | 'BVC';

type CombinatorialTupleStructureLookupTable<L, R> = {
  VNA: [L, _];
  NVA: [_, R];
  VVA: [L, R];
  VBC: [L    , R | _];
  BVC: [L | _, R    ];
}

type ResolveTupleStructureCodeToUnionOfValuesFromLookupTable<
  LookupTable extends Record<CombinatorialTupleStructureCode, unknown>,
  TupleStructureCode extends TupleStructureCodeToDetailingModifierCombinations
> = LookupTable[ResolveAliasFullyRecursively<TupleStructureCode>];

type ResolveUnionOfTuples<
  L,
  R,
  TupleStructureCode extends TupleStructureCodeToDetailingModifierCombinations
> = ResolveTupleStructureCodeToUnionOfValuesFromLookupTable<
  CombinatorialTupleStructureLookupTable<L, R>,
  TupleStructureCode
>;


export type Or<
  ArrayOfValuesToCheck,
> = ArrayOfValuesToCheck extends [infer CurrentElement, ...infer Other]
  ? [CurrentElement] extends [true]
    ? true
    : And<Other>
  : false;




export type AreAllNotNever<
  ArrayOfValuesToCheck extends unknown[] | [],
  ReturnIfAllAreNotNever = true,
  ReturnIfAllSomeAreNever = false
> = ArrayOfValuesToCheck extends [infer CurrentElement, ...infer Other]
  ? [CurrentElement] extends [never]
    ? ReturnIfAllSomeAreNever
    : AreAllNotNever<Other, ReturnIfAllAreNotNever, ReturnIfAllSomeAreNever>
  : ReturnIfAllAreNotNever;


type Not<T extends boolean> = [T] extends [true] ? false : true;


type HasV<T> = [Exclude<T, _>] extends [never] ? false : true;
type Has_<T> = [Extract<T, _>] extends [never] ? false : true;
type IsV<T>  = And<[HasV<T>, Not<Has_<T>>]>;
type IsN<T>  = And<[Has_<T>, Not<HasV<T>>]>;



type UnknownTuple = [unknown, unknown]

// `IS` is a precise match. If expected VBA<L, R>, `Tuple` should be precisely `[L, _] | [_, R]`
// `AssignableTo` is a loose match.

// ATOMS
// export type IsVNA<Tuple extends UnknownTuple> = And<[IsV<Tuple[0]>, IsN<Tuple[1]>]>; // [L, _]
// export type IsNVA<Tuple extends UnknownTuple> = And<[IsN<Tuple[0]>, IsV<Tuple[1]>]>; // [_, R]
// export type IsVVA<Tuple extends UnknownTuple> = And<[IsV<Tuple[0]>, IsV<Tuple[1]>]>; // [L, R]

// To better understand atoms with letter B in code, see according compact




export type And<
  ArrayOfValuesToCheck,
> = ArrayOfValuesToCheck extends [infer CurrentElement, ...infer Other]
  ? [CurrentElement] extends [false]
    ? false
    : And<Other>
  : true;

type TupleValidationLookupTable<Tuple extends UnknownTuple, ExpectedLength extends number> = {
  VNA: And<[IsV<Tuple[0]>, IsN<Tuple[1]>]> extends true ? `VNA${ExpectedLength} +` : `VNA${ExpectedLength} -`;
  NVA: And<[IsN<Tuple[0]>, IsV<Tuple[1]>]> extends true ? `NVA${ExpectedLength} +` : `NVA${ExpectedLength} -`;
  VVA: And<[IsV<Tuple[0]>, IsV<Tuple[1]>]> extends true ? `VVA${ExpectedLength} +` : `VVA${ExpectedLength} -`;
  VBC: And<[IsV<Tuple[0]>, HasV<Tuple[1]>, Has_<Tuple[1]>]> extends true ? `VBC${ExpectedLength} +` : `VBC${ExpectedLength} -`;
  BVC: And<[HasV<Tuple[0]>, Has_<Tuple[0]>, IsV<Tuple[1]>]> extends true ? `BVC${ExpectedLength} +` : `BVC${ExpectedLength} -`;
};

export type FuckingMagic2 <
  SingularTuple extends UnknownTuple,
  ElementsCounted extends number,
  TupleStructureCodeUnionToBeDecomposed extends TupleStructureCodeToDetailingModifierCombinations
> =
  ResolveTupleStructureCodeToUnionOfValuesFromLookupTable<
    TupleValidationLookupTable<
      SingularTuple,
      ElementsCounted
    > ,
    TupleStructureCodeUnionToBeDecomposed
  >


type kasjbdfla<T extends UnknownTuple, Code extends TupleStructureCodeToDetailingModifierCombinations>
  = CountElementsInAUnion<T> extends infer U extends number ? T extends any ? FuckingMagic2<T, U, Code> : never : never

type SimpleEquals<A1, A2> = [A1, A2] extends [A2, A1] ? true : false;

type Is<TupleUnionToInspect extends UnknownTuple, ExpectedTupleStructureCode extends TupleStructureCodeToDetailingModifierCombinations, Diagnostics = false> =
  ResolveUnionOfTuples<0, 1, ExpectedTupleStructureCode> extends infer Ideal extends UnknownTuple?
  (And<[
    Equals<
      kasjbdfla<TupleUnionToInspect, ExpectedTupleStructureCode>,
      kasjbdfla<Ideal, ExpectedTupleStructureCode>
    >,
    SimpleEquals<
      CountElementsInAUnion<TupleUnionToInspect>,
      CountElementsInAUnion<Ideal>
    >
  ]>
)
  :never


export type IsVNA<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'VNA', Diagnostics>;
export type IsNVA<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'NVA', Diagnostics>;
export type IsVVA<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'VVA', Diagnostics>;
export type IsVBA<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'VBA', Diagnostics>;
export type IsBVA<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'BVA', Diagnostics>;
export type IsBBA<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'BBA', Diagnostics>;
export type IsVNC<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'VNC', Diagnostics>;
export type IsNVC<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'NVC', Diagnostics>;
export type IsVVC<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'VVC', Diagnostics>;
export type IsVBC<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'VBC', Diagnostics>;
export type IsBVC<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'BVC', Diagnostics>;
export type IsBBC<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'BBC', Diagnostics>;
export type IsVNE<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'VNE', Diagnostics>;
export type IsNVE<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'NVE', Diagnostics>;
export type IsVVE<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'VVE', Diagnostics>;
export type IsVBE<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'VBE', Diagnostics>;
export type IsBVE<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'BVE', Diagnostics>;
export type IsBBE<Tuple extends UnknownTuple, Diagnostics = false> = Is<Tuple, 'BBE', Diagnostics>;




type CountElementsInAUnion<T> = TuplifyUnion<
  T extends any ? (_: T) => T : never
>['length']

const L = Symbol('L');
const R = Symbol('R');

type L = typeof L;
type R = typeof R;

assert<Equals<IsVNA<VNA<L, R>>, true >>;
assert<Equals<IsVNA<NVA<L, R>>, false >>;
assert<Equals<IsVNA<VVA<L, R>>, false >>;
assert<Equals<IsVNA<VBA<L, R>>, false >>;
assert<Equals<IsVNA<BVA<L, R>>, false >>;
assert<Equals<IsVNA<BBA<L, R>>, false >>;
assert<Equals<IsVNA<VNC<L, R>>, true >>;
assert<Equals<IsVNA<NVC<L, R>>, false >>;
assert<Equals<IsVNA<VVC<L, R>>, false >>;
assert<Equals<IsVNA<VBC<L, R>>, false >>;
assert<Equals<IsVNA<BVC<L, R>>, false >>;
assert<Equals<IsVNA<BBC<L, R>>, false >>;
assert<Equals<IsVNA<VNE<L, R>>, true >>;
assert<Equals<IsVNA<NVE<L, R>>, false >>;
assert<Equals<IsVNA<VVE<L, R>>, false >>;
assert<Equals<IsVNA<VBE<L, R>>, false >>;
assert<Equals<IsVNA<BVE<L, R>>, false >>;
assert<Equals<IsVNA<BBE<L, R>>, false >>;

assert<Equals<IsNVA<VNA<L, R>>, false >>;
assert<Equals<IsNVA<NVA<L, R>>, true >>;
assert<Equals<IsNVA<VVA<L, R>>, false >>;
assert<Equals<IsNVA<VBA<L, R>>, false >>;
assert<Equals<IsNVA<BVA<L, R>>, false >>;
assert<Equals<IsNVA<BBA<L, R>>, false >>;
assert<Equals<IsNVA<VNC<L, R>>, false >>;
assert<Equals<IsNVA<NVC<L, R>>, true >>;
assert<Equals<IsNVA<VVC<L, R>>, false >>;
assert<Equals<IsNVA<VBC<L, R>>, false >>;
assert<Equals<IsNVA<BVC<L, R>>, false >>;
assert<Equals<IsNVA<BBC<L, R>>, false >>;
assert<Equals<IsNVA<VNE<L, R>>, false >>;
assert<Equals<IsNVA<NVE<L, R>>, true >>;
assert<Equals<IsNVA<VVE<L, R>>, false >>;
assert<Equals<IsNVA<VBE<L, R>>, false >>;
assert<Equals<IsNVA<BVE<L, R>>, false >>;
assert<Equals<IsNVA<BBE<L, R>>, false >>;

assert<Equals<IsVVA<VNA<L, R>>, false >>;
assert<Equals<IsVVA<NVA<L, R>>, false >>;
assert<Equals<IsVVA<VVA<L, R>>, true >>;
assert<Equals<IsVVA<VBA<L, R>>, false >>;
assert<Equals<IsVVA<BVA<L, R>>, false >>;
assert<Equals<IsVVA<BBA<L, R>>, false >>;
assert<Equals<IsVVA<VNC<L, R>>, false >>;
assert<Equals<IsVVA<NVC<L, R>>, false >>;
assert<Equals<IsVVA<VVC<L, R>>, true >>;
assert<Equals<IsVVA<VBC<L, R>>, false >>;
assert<Equals<IsVVA<BVC<L, R>>, false >>;
assert<Equals<IsVVA<BBC<L, R>>, false >>;
assert<Equals<IsVVA<VNE<L, R>>, false >>;
assert<Equals<IsVVA<NVE<L, R>>, false >>;
assert<Equals<IsVVA<VVE<L, R>>, true >>;
assert<Equals<IsVVA<VBE<L, R>>, false >>;
assert<Equals<IsVVA<BVE<L, R>>, false >>;
assert<Equals<IsVVA<BBE<L, R>>, false >>;

assert<Equals<IsVBA<VNA<L, R>>, false >>;
assert<Equals<IsVBA<NVA<L, R>>, false >>;
assert<Equals<IsVBA<VVA<L, R>>, false >>;
assert<Equals<IsVBA<VBA<L, R>>, true >>;
assert<Equals<IsVBA<BVA<L, R>>, false >>;
assert<Equals<IsVBA<BBA<L, R>>, false >>;
assert<Equals<IsVBA<VNC<L, R>>, false >>;
assert<Equals<IsVBA<NVC<L, R>>, false >>;
assert<Equals<IsVBA<VVC<L, R>>, false >>;
assert<Equals<IsVBA<VBC<L, R>>, false >>;
assert<Equals<IsVBA<BVC<L, R>>, false >>;
assert<Equals<IsVBA<BBC<L, R>>, false >>;
assert<Equals<IsVBA<VNE<L, R>>, false >>;
assert<Equals<IsVBA<NVE<L, R>>, false >>;
assert<Equals<IsVBA<VVE<L, R>>, false >>;
assert<Equals<IsVBA<VBE<L, R>>, false >>;
assert<Equals<IsVBA<BVE<L, R>>, false >>;
assert<Equals<IsVBA<BBE<L, R>>, false >>;

assert<Equals<IsBVA<VNA<L, R>>, false >>;
assert<Equals<IsBVA<NVA<L, R>>, false >>;
assert<Equals<IsBVA<VVA<L, R>>, false >>;
assert<Equals<IsBVA<VBA<L, R>>, false >>;
assert<Equals<IsBVA<BVA<L, R>>, true >>;
assert<Equals<IsBVA<BBA<L, R>>, false >>;
assert<Equals<IsBVA<VNC<L, R>>, false >>;
assert<Equals<IsBVA<NVC<L, R>>, false >>;
assert<Equals<IsBVA<VVC<L, R>>, false >>;
assert<Equals<IsBVA<VBC<L, R>>, false >>;
assert<Equals<IsBVA<BVC<L, R>>, false >>;
assert<Equals<IsBVA<BBC<L, R>>, false >>;
assert<Equals<IsBVA<VNE<L, R>>, false >>;
assert<Equals<IsBVA<NVE<L, R>>, false >>;
assert<Equals<IsBVA<VVE<L, R>>, false >>;
assert<Equals<IsBVA<VBE<L, R>>, false >>;
assert<Equals<IsBVA<BVE<L, R>>, false >>;
assert<Equals<IsBVA<BBE<L, R>>, false >>;

assert<Equals<IsBBA<VNA<L, R>>, false >>;
assert<Equals<IsBBA<NVA<L, R>>, false >>;
assert<Equals<IsBBA<VVA<L, R>>, false >>;
assert<Equals<IsBBA<VBA<L, R>>, false >>;
assert<Equals<IsBBA<BVA<L, R>>, false >>;
assert<Equals<IsBBA<BBA<L, R>>, true >>;
assert<Equals<IsBBA<VNC<L, R>>, false >>;
assert<Equals<IsBBA<NVC<L, R>>, false >>;
assert<Equals<IsBBA<VVC<L, R>>, false >>;
assert<Equals<IsBBA<VBC<L, R>>, false >>;
assert<Equals<IsBBA<BVC<L, R>>, false >>;
assert<Equals<IsBBA<BBC<L, R>>, false >>;
assert<Equals<IsBBA<VNE<L, R>>, false >>;
assert<Equals<IsBBA<NVE<L, R>>, false >>;
assert<Equals<IsBBA<VVE<L, R>>, false >>;
assert<Equals<IsBBA<VBE<L, R>>, false >>;
assert<Equals<IsBBA<BVE<L, R>>, false >>;
assert<Equals<IsBBA<BBE<L, R>>, false >>;

assert<Equals<IsVNC<VNA<L, R>>, true >>;
assert<Equals<IsVNC<NVA<L, R>>, false >>;
assert<Equals<IsVNC<VVA<L, R>>, false >>;
assert<Equals<IsVNC<VBA<L, R>>, false >>;
assert<Equals<IsVNC<BVA<L, R>>, false >>;
assert<Equals<IsVNC<BBA<L, R>>, false >>;
assert<Equals<IsVNC<VNC<L, R>>, true >>;
assert<Equals<IsVNC<NVC<L, R>>, false >>;
assert<Equals<IsVNC<VVC<L, R>>, false >>;
assert<Equals<IsVNC<VBC<L, R>>, false >>;
assert<Equals<IsVNC<BVC<L, R>>, false >>;
assert<Equals<IsVNC<BBC<L, R>>, false >>;
assert<Equals<IsVNC<VNE<L, R>>, true >>;
assert<Equals<IsVNC<NVE<L, R>>, false >>;
assert<Equals<IsVNC<VVE<L, R>>, false >>;
assert<Equals<IsVNC<VBE<L, R>>, false >>;
assert<Equals<IsVNC<BVE<L, R>>, false >>;
assert<Equals<IsVNC<BBE<L, R>>, false >>;

assert<Equals<IsNVC<VNA<L, R>>, false >>;
assert<Equals<IsNVC<NVA<L, R>>, true >>;
assert<Equals<IsNVC<VVA<L, R>>, false >>;
assert<Equals<IsNVC<VBA<L, R>>, false >>;
assert<Equals<IsNVC<BVA<L, R>>, false >>;
assert<Equals<IsNVC<BBA<L, R>>, false >>;
assert<Equals<IsNVC<VNC<L, R>>, false >>;
assert<Equals<IsNVC<NVC<L, R>>, true >>;
assert<Equals<IsNVC<VVC<L, R>>, false >>;
assert<Equals<IsNVC<VBC<L, R>>, false >>;
assert<Equals<IsNVC<BVC<L, R>>, false >>;
assert<Equals<IsNVC<BBC<L, R>>, false >>;
assert<Equals<IsNVC<VNE<L, R>>, false >>;
assert<Equals<IsNVC<NVE<L, R>>, true >>;
assert<Equals<IsNVC<VVE<L, R>>, false >>;
assert<Equals<IsNVC<VBE<L, R>>, false >>;
assert<Equals<IsNVC<BVE<L, R>>, false >>;
assert<Equals<IsNVC<BBE<L, R>>, false >>;

assert<Equals<IsVVC<VNA<L, R>>, false >>;
assert<Equals<IsVVC<NVA<L, R>>, false >>;
assert<Equals<IsVVC<VVA<L, R>>, true >>;
assert<Equals<IsVVC<VBA<L, R>>, false >>;
assert<Equals<IsVVC<BVA<L, R>>, false >>;
assert<Equals<IsVVC<BBA<L, R>>, false >>;
assert<Equals<IsVVC<VNC<L, R>>, false >>;
assert<Equals<IsVVC<NVC<L, R>>, false >>;
assert<Equals<IsVVC<VVC<L, R>>, true >>;
assert<Equals<IsVVC<VBC<L, R>>, false >>;
assert<Equals<IsVVC<BVC<L, R>>, false >>;
assert<Equals<IsVVC<BBC<L, R>>, false >>;
assert<Equals<IsVVC<VNE<L, R>>, false >>;
assert<Equals<IsVVC<NVE<L, R>>, false >>;
assert<Equals<IsVVC<VVE<L, R>>, true >>;
assert<Equals<IsVVC<VBE<L, R>>, false >>;
assert<Equals<IsVVC<BVE<L, R>>, false >>;
assert<Equals<IsVVC<BBE<L, R>>, false >>;

assert<Equals<IsVBC<VNA<L, R>>, false >>;
assert<Equals<IsVBC<NVA<L, R>>, false >>;
assert<Equals<IsVBC<VVA<L, R>>, false >>;
assert<Equals<IsVBC<VBA<L, R>>, false >>;
assert<Equals<IsVBC<BVA<L, R>>, false >>;
assert<Equals<IsVBC<BBA<L, R>>, false >>;
assert<Equals<IsVBC<VNC<L, R>>, false >>;
assert<Equals<IsVBC<NVC<L, R>>, false >>;
assert<Equals<IsVBC<VVC<L, R>>, false >>;
assert<Equals<IsVBC<VBC<L, R>>, true >>;
assert<Equals<IsVBC<BVC<L, R>>, false >>;
assert<Equals<IsVBC<BBC<L, R>>, false >>;
assert<Equals<IsVBC<VNE<L, R>>, false >>;
assert<Equals<IsVBC<NVE<L, R>>, false >>;
assert<Equals<IsVBC<VVE<L, R>>, false >>;
assert<Equals<IsVBC<VBE<L, R>>, false >>;
assert<Equals<IsVBC<BVE<L, R>>, false >>;
assert<Equals<IsVBC<BBE<L, R>>, false >>;

assert<Equals<IsBVC<VNA<L, R>>, false >>;
assert<Equals<IsBVC<NVA<L, R>>, false >>;
assert<Equals<IsBVC<VVA<L, R>>, false >>;
assert<Equals<IsBVC<VBA<L, R>>, false >>;
assert<Equals<IsBVC<BVA<L, R>>, false >>;
assert<Equals<IsBVC<BBA<L, R>>, false >>;
assert<Equals<IsBVC<VNC<L, R>>, false >>;
assert<Equals<IsBVC<NVC<L, R>>, false >>;
assert<Equals<IsBVC<VVC<L, R>>, false >>;
assert<Equals<IsBVC<VBC<L, R>>, false >>;
assert<Equals<IsBVC<BVC<L, R>>, true >>;
assert<Equals<IsBVC<BBC<L, R>>, false >>;
assert<Equals<IsBVC<VNE<L, R>>, false >>;
assert<Equals<IsBVC<NVE<L, R>>, false >>;
assert<Equals<IsBVC<VVE<L, R>>, false >>;
assert<Equals<IsBVC<VBE<L, R>>, false >>;
assert<Equals<IsBVC<BVE<L, R>>, false >>;
assert<Equals<IsBVC<BBE<L, R>>, false >>;

assert<Equals<IsBBC<VNA<L, R>>, false >>;
assert<Equals<IsBBC<NVA<L, R>>, false >>;
assert<Equals<IsBBC<VVA<L, R>>, false >>;
assert<Equals<IsBBC<VBA<L, R>>, false >>;
assert<Equals<IsBBC<BVA<L, R>>, false >>;
assert<Equals<IsBBC<BBA<L, R>>, false >>;
assert<Equals<IsBBC<VNC<L, R>>, false >>;
assert<Equals<IsBBC<NVC<L, R>>, false >>;
assert<Equals<IsBBC<VVC<L, R>>, false >>;
assert<Equals<IsBBC<VBC<L, R>>, false >>;
assert<Equals<IsBBC<BVC<L, R>>, false >>;
assert<Equals<IsBBC<BBC<L, R>>, true >>;
assert<Equals<IsBBC<VNE<L, R>>, false >>;
assert<Equals<IsBBC<NVE<L, R>>, false >>;
assert<Equals<IsBBC<VVE<L, R>>, false >>;
assert<Equals<IsBBC<VBE<L, R>>, false >>;
assert<Equals<IsBBC<BVE<L, R>>, false >>;
assert<Equals<IsBBC<BBE<L, R>>, false >>;

assert<Equals<IsVNE<VNA<L, R>>, true >>;
assert<Equals<IsVNE<NVA<L, R>>, false >>;
assert<Equals<IsVNE<VVA<L, R>>, false >>;
assert<Equals<IsVNE<VBA<L, R>>, false >>;
assert<Equals<IsVNE<BVA<L, R>>, false >>;
assert<Equals<IsVNE<BBA<L, R>>, false >>;
assert<Equals<IsVNE<VNC<L, R>>, true >>;
assert<Equals<IsVNE<NVC<L, R>>, false >>;
assert<Equals<IsVNE<VVC<L, R>>, false >>;
assert<Equals<IsVNE<VBC<L, R>>, false >>;
assert<Equals<IsVNE<BVC<L, R>>, false >>;
assert<Equals<IsVNE<BBC<L, R>>, false >>;
assert<Equals<IsVNE<VNE<L, R>>, true >>;
assert<Equals<IsVNE<NVE<L, R>>, false >>;
assert<Equals<IsVNE<VVE<L, R>>, false >>;
assert<Equals<IsVNE<VBE<L, R>>, false >>;
assert<Equals<IsVNE<BVE<L, R>>, false >>;
assert<Equals<IsVNE<BBE<L, R>>, false >>;

assert<Equals<IsNVE<VNA<L, R>>, false >>;
assert<Equals<IsNVE<NVA<L, R>>, true >>;
assert<Equals<IsNVE<VVA<L, R>>, false >>;
assert<Equals<IsNVE<VBA<L, R>>, false >>;
assert<Equals<IsNVE<BVA<L, R>>, false >>;
assert<Equals<IsNVE<BBA<L, R>>, false >>;
assert<Equals<IsNVE<VNC<L, R>>, false >>;
assert<Equals<IsNVE<NVC<L, R>>, true >>;
assert<Equals<IsNVE<VVC<L, R>>, false >>;
assert<Equals<IsNVE<VBC<L, R>>, false >>;
assert<Equals<IsNVE<BVC<L, R>>, false >>;
assert<Equals<IsNVE<BBC<L, R>>, false >>;
assert<Equals<IsNVE<VNE<L, R>>, false >>;
assert<Equals<IsNVE<NVE<L, R>>, true >>;
assert<Equals<IsNVE<VVE<L, R>>, false >>;
assert<Equals<IsNVE<VBE<L, R>>, false >>;
assert<Equals<IsNVE<BVE<L, R>>, false >>;
assert<Equals<IsNVE<BBE<L, R>>, false >>;

assert<Equals<IsVVE<VNA<L, R>>, false >>;
assert<Equals<IsVVE<NVA<L, R>>, false >>;
assert<Equals<IsVVE<VVA<L, R>>, true >>;
assert<Equals<IsVVE<VBA<L, R>>, false >>;
assert<Equals<IsVVE<BVA<L, R>>, false >>;
assert<Equals<IsVVE<BBA<L, R>>, false >>;
assert<Equals<IsVVE<VNC<L, R>>, false >>;
assert<Equals<IsVVE<NVC<L, R>>, false >>;
assert<Equals<IsVVE<VVC<L, R>>, true >>;
assert<Equals<IsVVE<VBC<L, R>>, false >>;
assert<Equals<IsVVE<BVC<L, R>>, false >>;
assert<Equals<IsVVE<BBC<L, R>>, false >>;
assert<Equals<IsVVE<VNE<L, R>>, false >>;
assert<Equals<IsVVE<NVE<L, R>>, false >>;
assert<Equals<IsVVE<VVE<L, R>>, true >>;
assert<Equals<IsVVE<VBE<L, R>>, false >>;
assert<Equals<IsVVE<BVE<L, R>>, false >>;
assert<Equals<IsVVE<BBE<L, R>>, false >>;

assert<Equals<IsVBE<VNA<L, R>>, false >>;
assert<Equals<IsVBE<NVA<L, R>>, false >>;
assert<Equals<IsVBE<VVA<L, R>>, false >>;
assert<Equals<IsVBE<VBA<L, R>>, false >>;
assert<Equals<IsVBE<BVA<L, R>>, false >>;
assert<Equals<IsVBE<BBA<L, R>>, false >>;
assert<Equals<IsVBE<VNC<L, R>>, false >>;
assert<Equals<IsVBE<NVC<L, R>>, false >>;
assert<Equals<IsVBE<VVC<L, R>>, false >>;
assert<Equals<IsVBE<VBC<L, R>>, false >>;
assert<Equals<IsVBE<BVC<L, R>>, false >>;
assert<Equals<IsVBE<BBC<L, R>>, false >>;
assert<Equals<IsVBE<VNE<L, R>>, false >>;
assert<Equals<IsVBE<NVE<L, R>>, false >>;
assert<Equals<IsVBE<VVE<L, R>>, false >>;
assert<Equals<IsVBE<VBE<L, R>>, true >>;
assert<Equals<IsVBE<BVE<L, R>>, false >>;
assert<Equals<IsVBE<BBE<L, R>>, false >>;

assert<Equals<IsBVE<VNA<L, R>>, false >>;
assert<Equals<IsBVE<NVA<L, R>>, false >>;
assert<Equals<IsBVE<VVA<L, R>>, false >>;
assert<Equals<IsBVE<VBA<L, R>>, false >>;
assert<Equals<IsBVE<BVA<L, R>>, false >>;
assert<Equals<IsBVE<BBA<L, R>>, false >>;
assert<Equals<IsBVE<VNC<L, R>>, false >>;
assert<Equals<IsBVE<NVC<L, R>>, false >>;
assert<Equals<IsBVE<VVC<L, R>>, false >>;
assert<Equals<IsBVE<VBC<L, R>>, false >>;
assert<Equals<IsBVE<BVC<L, R>>, false >>;
assert<Equals<IsBVE<BBC<L, R>>, false >>;
assert<Equals<IsBVE<VNE<L, R>>, false >>;
assert<Equals<IsBVE<NVE<L, R>>, false >>;
assert<Equals<IsBVE<VVE<L, R>>, false >>;
assert<Equals<IsBVE<VBE<L, R>>, false >>;
assert<Equals<IsBVE<BVE<L, R>>, true >>;
assert<Equals<IsBVE<BBE<L, R>>, false >>;

assert<Equals<IsBBE<VNA<L, R>>, false >>;
assert<Equals<IsBBE<NVA<L, R>>, false >>;
assert<Equals<IsBBE<VVA<L, R>>, false >>;
assert<Equals<IsBBE<VBA<L, R>>, false >>;
assert<Equals<IsBBE<BVA<L, R>>, false >>;
assert<Equals<IsBBE<BBA<L, R>>, false >>;
assert<Equals<IsBBE<VNC<L, R>>, false >>;
assert<Equals<IsBBE<NVC<L, R>>, false >>;
assert<Equals<IsBBE<VVC<L, R>>, false >>;
assert<Equals<IsBBE<VBC<L, R>>, false >>;
assert<Equals<IsBBE<BVC<L, R>>, false >>;
assert<Equals<IsBBE<BBC<L, R>>, false >>;
assert<Equals<IsBBE<VNE<L, R>>, false >>;
assert<Equals<IsBBE<NVE<L, R>>, false >>;
assert<Equals<IsBBE<VVE<L, R>>, false >>;
assert<Equals<IsBBE<VBE<L, R>>, false >>;
assert<Equals<IsBBE<BVE<L, R>>, false >>;
assert<Equals<IsBBE<BBE<L, R>>, true >>;





export type ShouldAddLeftExclusivePart = '0' | '1';
export type ShouldAddInnerPart = '0' | '1';
export type ShouldAddRightExclusivePart = '0' | '1';

export type VennDiagramPartsCombinations =
  Exclude<`${
    ShouldAddLeftExclusivePart
  }${
    ShouldAddInnerPart
  }${
    ShouldAddRightExclusivePart
  }`, '000'>
;



export type TupleStructureCodeBy<
  VennDiagramParts extends VennDiagramPartsCombinations
> =
  [VennDiagramParts] extends ['001'] ? 'NV' : // right join excluding inner
  [VennDiagramParts] extends ['010'] ? 'VV' : // inner join
  [VennDiagramParts] extends ['011'] ? 'BV' : // right outer join (right join)
  [VennDiagramParts] extends ['100'] ? 'VN' : // left join excluding inner
  [VennDiagramParts] extends ['101'] ? 'VN' | 'NV' : // full outer join excluding inner
  [VennDiagramParts] extends ['110'] ? 'VB' : // left outer join (left join)
  [VennDiagramParts] extends ['111'] ? 'BB' : // full outer join (full join)
  ForbiddenLiteralUnion<'VennDiagramParts', 'TupleStructureCodeBy'>
;

export type TupleStructureCodeAcceptingUnionBy<
  VennDiagramPartsUnion extends VennDiagramPartsCombinations
> =
  {
    '001': 'NV';
    '010': 'VV';
    '011': 'BV';
    '100': 'VN';
    '101': 'VN' | 'NV';
    '110': 'VB';
    '111': 'BB';
  }[VennDiagramPartsUnion]
;


/**
 * Excluding `NN`, `NB` (`NN | NV`) and `BN` (`NN | VN`) doesn't mean there will
 * be no emptiness (unique symbol stored in constant named `_`) as values in the
 * result. It means that merge function will never get emptiness in both left
 * and right slot of the same tuple, because such merge is impossible
 */
export type TupleStructureCode = Exclude<
  `${LeftTupleStructureCodePart}${RightTupleStructureCodePart}`,
  'NN' | 'NB' | 'BN'
>;

export type TupleStructureCodeToDetailingModifierCombinations =
  `${TupleStructureCode}${LevelOfDetailModifier}`;


export type SelectJoinedTuples<
  L,
  R,
  Comb extends TupleStructureCodeToDetailingModifierCombinations
> =
  [Comb] extends ['VNA'] ? VNA<L, R> :
  [Comb] extends ['NVA'] ? NVA<L, R> :
  [Comb] extends ['VVA'] ? VVA<L, R> :
  [Comb] extends ['VBA'] ? VBA<L, R> :
  [Comb] extends ['BVA'] ? BVA<L, R> :
  [Comb] extends ['BBA'] ? BBA<L, R> :
  [Comb] extends ['VNC'] ? VNC<L, R> :
  [Comb] extends ['NVC'] ? NVC<L, R> :
  [Comb] extends ['VVC'] ? VVC<L, R> :
  [Comb] extends ['VBC'] ? VBC<L, R> :
  [Comb] extends ['BVC'] ? BVC<L, R> :
  [Comb] extends ['BBC'] ? BBC<L, R> :
  [Comb] extends ['VNE'] ? VNE<L, R> :
  [Comb] extends ['NVE'] ? NVE<L, R> :
  [Comb] extends ['VVE'] ? VVE<L, R> :
  [Comb] extends ['VBE'] ? VBE<L, R> :
  [Comb] extends ['BVE'] ? BVE<L, R> :
  [Comb] extends ['BBE'] ? BBE<L, R> :
  ForbiddenLiteralUnion<'Comb', 'SelectJoinedTuples'>
;

export type SelectJoinedTuplesAcceptUnion<
  L,
  R,
  CombUnion extends TupleStructureCodeToDetailingModifierCombinations
> = {
  VNA: VNA<L, R>;
  NVA: NVA<L, R>;
  VVA: VVA<L, R>;
  VBA: VBA<L, R>;
  BVA: BVA<L, R>;
  BBA: BBA<L, R>;
  VNC: VNC<L, R>;
  NVC: NVC<L, R>;
  VVC: VVC<L, R>;
  VBC: VBC<L, R>;
  BVC: BVC<L, R>;
  BBC: BBC<L, R>;
  VNE: VNE<L, R>;
  NVE: NVE<L, R>;
  VVE: VVE<L, R>;
  VBE: VBE<L, R>;
  BVE: BVE<L, R>;
  BBE: BBE<L, R>;
}[CombUnion];










export type JoinOnVennDiagramParts<
  L,
  R,
  VennDiagramParts extends VennDiagramPartsCombinations,
  Detailing extends LevelOfDetailModifier,
> =
  // TupleStructureCodeBy can return string literal describing the error
  // (thrown when VennDiagramParts consists of union like "001" | "010"
  // instead of single string literal like "010") and for that reason `extends
  // TupleStructureCode` was added.
  TupleStructureCodeBy<VennDiagramParts> extends infer U extends TupleStructureCode
    ? SelectJoinedTuplesAcceptUnion<L, R, `${U}${Detailing}`>
    : ForbiddenLiteralUnion<'VennDiagramParts', 'Joiner'>
;


export type JoinOnJoinName<
  L,
  R,
  JoinName extends AllJoinNames,
  LevelOfDetail extends LevelOfDetailModifier,
> = JoinOnVennDiagramParts<
  L,
  R,
  typeof joinNameToVennDiagramParts[JoinName],
  LevelOfDetail
>;



export type LeftExclusiveJoin <L, R, Detailing extends LevelOfDetailModifier> = JoinOnVennDiagramParts<L, R, '100', Detailing>;
export type InnerJoin         <L, R, Detailing extends LevelOfDetailModifier> = JoinOnVennDiagramParts<L, R, '010', Detailing>;
export type RightExclusiveJoin<L, R, Detailing extends LevelOfDetailModifier> = JoinOnVennDiagramParts<L, R, '001', Detailing>;
export type LeftJoin          <L, R, Detailing extends LevelOfDetailModifier> = JoinOnVennDiagramParts<L, R, '110', Detailing>;
export type RightJoin         <L, R, Detailing extends LevelOfDetailModifier> = JoinOnVennDiagramParts<L, R, '011', Detailing>;
export type FullJoin          <L, R, Detailing extends LevelOfDetailModifier> = JoinOnVennDiagramParts<L, R, '111', Detailing>;
export type FullExclusiveJoin <L, R, Detailing extends LevelOfDetailModifier> = JoinOnVennDiagramParts<L, R, '101', Detailing>;

export type LeftOuterJoin <L, R, Detailing extends LevelOfDetailModifier> = LeftJoin          <L, R, Detailing>;
export type RightOuterJoin<L, R, Detailing extends LevelOfDetailModifier> = RightJoin         <L, R, Detailing>;
export type FullOuterJoin <L, R, Detailing extends LevelOfDetailModifier> = FullJoin          <L, R, Detailing>;
export type LeftAntiJoin  <L, R, Detailing extends LevelOfDetailModifier> = LeftExclusiveJoin <L, R, Detailing>;
export type RightAntiJoin <L, R, Detailing extends LevelOfDetailModifier> = RightExclusiveJoin<L, R, Detailing>;
export type FullAntiJoin  <L, R, Detailing extends LevelOfDetailModifier> = FullExclusiveJoin <L, R, Detailing>;
export type Join          <L, R, Detailing extends LevelOfDetailModifier> = InnerJoin         <L, R, Detailing>;
export type SimpleJoin    <L, R, Detailing extends LevelOfDetailModifier> = InnerJoin         <L, R, Detailing>;
export type CrossJoin     <L, R, Detailing extends LevelOfDetailModifier> = InnerJoin         <L, R, Detailing>;
