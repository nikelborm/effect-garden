import { getShuffledArrayFrom } from './getShuffledArrayFrom.helper.spec.ts';

export function getShufflingIterable<T>(
  notShuffledIterable: Iterable<T>,
): Iterable<T> {
  const sourceArr = [...notShuffledIterable];

  const iterable = {
    [Symbol.iterator]() {
      let i = -1;
      const newArr = getShuffledArrayFrom(sourceArr);
      return {
        next() {
          i += 1;
          return i < newArr.length
            ? ({ value: newArr[i]!, done: false } as const)
            : ({ value: undefined, done: true } as const);
        },
      };
    },
  };
  return iterable;
}
