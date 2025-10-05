import { objectKeys } from 'tsafe';

/**
 * A symbol representing an empty slot similar to how an actual SQL query
 * executor will put NULL on the exclusive left or right sides of the join
 */
export const _ = Symbol('Empty slot');
export type _ = typeof _;

/**
 * An object with join names (without aliases) as keys, and according venn
 * diagram bit-masks as values (see
 * {@link VennDiagramBitMaskFor|Venn diagram bit mask enum}).
 */
export const joinNameToVennDiagramPartsWithoutAliases = Object.freeze({
  leftJoin     : '110',
  rightJoin    : '011',
  fullJoin     : '111',
  innerJoin    : '010',
  crossJoin    : '010',
  leftAntiJoin : '100',
  rightAntiJoin: '001',
  fullAntiJoin : '101',
} as const);

/**
 * An object with join names  as keys, and according venn diagram bit-masks as
 * values (see {@link VennDiagramBitMaskFor|Venn diagram bit mask enum}).
 */
export const joinNameToVennDiagramParts = Object.freeze({
  ...joinNameToVennDiagramPartsWithoutAliases,
  leftOuterJoin     : '110',
  rightOuterJoin    : '011',
  fullOuterJoin     : '111',
  join              : '010',
  simpleJoin        : '010',
  leftOuterAntiJoin : '100',
  rightOuterAntiJoin: '001',
  fullOuterAntiJoin : '101',

  leftExclusiveJoin      : '100',
  leftJoinExcludingInner : '100',
  rightExclusiveJoin     : '001',
  rightJoinExcludingInner: '001',
  fullExclusiveJoin      : '101',
  fullJoinExcludingInner : '101',
} as const);

/**
 * An array of supported join names without join aliases.
 */
export const joinNamesWithoutAliases = objectKeys(joinNameToVennDiagramPartsWithoutAliases);

/**
 * An array of all supported join names including join aliases.
 */
export const joinNames = objectKeys(joinNameToVennDiagramParts);

/**
 * This enum has bit-masks to choose which subsets to yield as a result of
 * joining 2 entity sets (iterables). Each of the 3 distinctive subsets of Venn
 * diagram is represented by each bit. You can `|` (`or`) such masks to get
 * combinations of resulting subsets.
 *
 * ```plaintext
 *      .-"""-. .-"""-.     |
 *    .'     .'‾'.     '.   |
 *   /      /     \      \  | 4 = 0b100 (1 bit representing left outer part)
 *   |   4  |  2  |  1   |  | 2 = 0b010 (1 bit representing middle inner part)
 *   \      \     /      /  | 1 = 0b001 (1 bit representing right outer part)
 *    '.     '. .'     .'   |
 *      '-...-'‾'-...-'     |
 * ```
 */
export const VennDiagramBitMaskFor = {
  LeftExclusivePart  : 0b100,
  InnerPart          : 0b010,
  RightExclusivePart : 0b001,
} as const
