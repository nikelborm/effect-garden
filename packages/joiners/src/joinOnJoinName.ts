import { joinNameToVennDiagramParts } from './constants.ts';
import { joinOnVennDiagramParts } from './joinOnVennDiagramParts.ts';
import type {
  AllJoinNames,
  LevelOfDetailModifier,
  JoinOnJoinName,
  VVA,
} from './types.ts';

export function buildJoinerOnJoinNameWithCustomDetailingModifier<
  LevelOfDetail extends LevelOfDetailModifier = 'A',
>(): JoinerOnJoinNameWithCustomDetailingModifier<LevelOfDetail> {
  function joinOnJoinName<
    L,
    R,
    MergedResult,
    const JoinName extends AllJoinNames,
  >(
    left: Iterable<L>,
    right: Iterable<R>,
    joinName: JoinName,
    merge: (
      tuple: JoinOnJoinName<L, R, JoinName, LevelOfDetail>,
    ) => MergedResult,
    passesJoinCondition?: (tuple: VVA<L, R>) => boolean,
    trustElementsOrderConsistencyOfRightIterable?: boolean,
  ): Generator<MergedResult> {
    if ((joinName === 'crossJoin') !== (passesJoinCondition === undefined))
      throw new Error(
        'You either choose only crossJoin, or specify only join condition. Not both.',
      );

    return joinOnVennDiagramParts(
      left,
      right,
      joinNameToVennDiagramParts[joinName],
      merge,
      joinName === 'crossJoin'
        ? () => true
        : (passesJoinCondition as (tuple: VVA<L, R>) => boolean),
      trustElementsOrderConsistencyOfRightIterable,
    );
  }

  return joinOnJoinName satisfies JoinerOnJoinNameWithCustomDetailingModifier<LevelOfDetail>;
}

export const joinWithAtomicMergeArgs =
  buildJoinerOnJoinNameWithCustomDetailingModifier<'A'>();
export const joinWithCompactedMergeArgs =
  buildJoinerOnJoinNameWithCustomDetailingModifier<'C'>();
export const joinWithExtendedMergeArgs =
  buildJoinerOnJoinNameWithCustomDetailingModifier<'E'>();

export const join = joinWithAtomicMergeArgs;

export type CrossJoinerWithCustomDetailingModifier<
  Detailing extends LevelOfDetailModifier,
> = <L, R, MergedResult, const JoinName extends 'crossJoin'>(
  left: Iterable<L>,
  right: Iterable<R>,
  joinName: JoinName,
  merge: (tuple: JoinOnJoinName<L, R, JoinName, Detailing>) => MergedResult,
) => Generator<MergedResult>;

type AnyJoinNameExceptCrossJoin = Exclude<AllJoinNames, 'crossJoin'>;

export type NonCrossJoinerWithCustomDetailingModifier<
  Detailing extends LevelOfDetailModifier,
> = <L, R, MergedResult, const JoinName extends AnyJoinNameExceptCrossJoin>(
  left: Iterable<L>,
  right: Iterable<R>,
  joinName: JoinName,
  merge: (tuple: JoinOnJoinName<L, R, JoinName, Detailing>) => MergedResult,
  passesJoinCondition: (tuple: VVA<L, R>) => boolean,
  trustElementsOrderConsistencyOfRightIterable?: boolean,
) => Generator<MergedResult>;

export type JoinerOnJoinNameWithCustomDetailingModifier<
  Detailing extends LevelOfDetailModifier,
> = NonCrossJoinerWithCustomDetailingModifier<Detailing> &
  CrossJoinerWithCustomDetailingModifier<Detailing>;
