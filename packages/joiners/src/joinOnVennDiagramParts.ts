import { _, VennDiagramBitMaskFor as ShouldAdd } from './constants.ts';
import type {
  LevelOfDetailModifier,
  VennDiagramPartsCombinations,
  JoinOnVennDiagramParts,
  VVA,
} from './types.ts';

export function buildJoinerOnVennDiagramPartsWithCustomDetailingModifier<
  Detailing extends LevelOfDetailModifier = 'A',
>() {
  return function* __joinOnVennDiagramParts<
    const VennDiagramParts extends VennDiagramPartsCombinations,
    L,
    R,
    MergedResult,
    TupleType = JoinOnVennDiagramParts<L, R, VennDiagramParts, Detailing>,
  >(
    left: Iterable<L>,
    _right: Iterable<R>,
    vennDiagramParts: VennDiagramParts,
    merge: (tuple: TupleType) => MergedResult,
    passesJoinCondition: (tuple: VVA<L, R>) => boolean,
    // This trust flag matters really only in cases when
    // `flags & ShouldAdd.RightExclusivePart` gives truthy result, and when
    // trust cannot be automatically established
    trustElementsOrderConsistencyOfRightIterable?: boolean,
  ): Generator<MergedResult> {
    const flags = parseInt(vennDiagramParts, 2);

    // Right is consumed more than once and since it's iterable, which has
    // iterable[Symbol.iterator]() method, the iterable is able to return
    // results in different order every time it called and so we have to make
    // sure order is consistent
    const isOrderStable = () =>
      Array.isArray(_right) ||
      _right instanceof Set ||
      _right instanceof Map ||
      trustElementsOrderConsistencyOfRightIterable;
    // I don't know how stable other Iterables, not mentioned in the function
    // above. Maybe others should be added here. PRs with sources to exact
    // places in ECMAscript specs are welcome

    const right = isOrderStable() ? _right : [..._right];

    const box =
      flags & ShouldAdd.RightExclusivePart
        ? { unmatchedRightIndices: new Set(Array.from(right, (e, i) => i)) }
        : {};

    for (const l of left) {
      let didLeftFailAllJoinConditions = true;
      let rIndex = -1;
      // Starts with -1 because is being incremented before used

      for (const r of right) {
        const tuple = [l, r] satisfies VVA<L, R>;
        rIndex += 1;

        if (!passesJoinCondition(tuple)) continue;
        didLeftFailAllJoinConditions = false;

        box.unmatchedRightIndices?.delete(rIndex);

        if (flags & ShouldAdd.InnerPart) yield merge(tuple as TupleType);
      }

      if (didLeftFailAllJoinConditions && flags & ShouldAdd.LeftExclusivePart)
        yield merge([l, _] as TupleType);
    }

    // If there's no Set in a box, it means the ShouldAdd.RightExclusivePart
    // flag is also not set, and there's no point to attempt to yield right
    // exclusive part
    if (!box.unmatchedRightIndices?.size) return;

    let rIndex = 0;

    for (const r of right) {
      if (box.unmatchedRightIndices.has(rIndex))
        yield merge([_, r] as TupleType);

      rIndex += 1;
    }
  };
}

export const joinOnVennDiagramPartsWithAtomicMergeArgs =
  buildJoinerOnVennDiagramPartsWithCustomDetailingModifier<'A'>();
export const joinOnVennDiagramPartsWithCompactedMergeArgs =
  buildJoinerOnVennDiagramPartsWithCustomDetailingModifier<'C'>();
export const joinOnVennDiagramPartsWithExtendedMergeArgs =
  buildJoinerOnVennDiagramPartsWithCustomDetailingModifier<'E'>();

export const joinOnVennDiagramParts = joinOnVennDiagramPartsWithAtomicMergeArgs;
