import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'

export const streamAll = <
  StreamMap extends {
    readonly [k in string]: Stream.Stream<unknown, unknown, unknown>
  },
>(
  map: StreamMap,
  bufferSize?: number | undefined,
) => {
  const streamCount = Object.keys(map).length
  return EFunction.pipe(
    Stream.mergeAll(
      Object.entries(map).map(([_tag, stream]) =>
        Stream.map(stream, value => ({ _tag, value })),
      ),
      { concurrency: 'unbounded', bufferSize },
    ),
    Stream.scan(
      () =>
        ({}) as {
          readonly [K in keyof StreamMap]: Stream.Success<StreamMap[K]>
        },
      (previous, { _tag: updatedParam, value: newParamValue }) => ({
        ...previous,
        [updatedParam]: newParamValue,
      }),
    ),
    Stream.filter(state => Object.keys(state).length === streamCount),
  )
}
