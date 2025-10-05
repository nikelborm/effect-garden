import { describe } from 'vitest';
import { invertBitsOf3bitLongNumber } from './invertBitsOf3bitLongNumber.ts';

describe('invertBitsOf3bitLongNumber', test => {
  for (const [param, expected] of [
    [0b000, 0b111],
    [0b001, 0b110],
    [0b010, 0b101],
    [0b011, 0b100],
    [0b100, 0b011],
    [0b101, 0b010],
    [0b110, 0b001],
    [0b111, 0b000],
  ] as const) {
    test(`invertBitsOf3bitLongNumber(${param}) === ${expected}`, ctx =>
      ctx.expect(invertBitsOf3bitLongNumber(param)).toEqual(expected));
  }
});
