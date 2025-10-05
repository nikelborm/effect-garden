// import { objectKeys } from 'tsafe';
// import { joinNameToVennDiagramParts } from './constants.ts';
import type { AllJoinNames } from './types.ts';

export const { asd, saddd } = { asd: 'asd', saddd: 'qewe' } as const;

// const save =
// objectKeys(joinNameToVennDiagramParts)

//   .map(key => {
//     key

//     export const joinWithAtomicMergeArgs = buildJoinerOnJoinNameWithCustomDetailingModifier<"A">();
//     export const joinWithCompactedMergeArgs = buildJoinerOnJoinNameWithCustomDetailingModifier<"C">();
//     export const joinWithExtendedMergeArgs = buildJoinerOnJoinNameWithCustomDetailingModifier<"E">();

//     export const join = joinWithAtomicMergeArgs;
//   })
type asd = {
  [Key in Exclude<AllJoinNames, 'crossJoin'>]: 'asd';
} & {
  crossJoin: <T>() => {};
};
