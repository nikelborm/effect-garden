import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'

export const streamAll = <
  StreamMap extends { [k in string]: Stream.Stream<any, any, any> },
>(
  map: StreamMap,
  bufferSize?: number | undefined,
) => {
  const streamCount = Object.keys(map).length
  return EFunction.pipe(
    Stream.mergeWithTag(map, { concurrency: 'unbounded', bufferSize }),
    Stream.scan(
      {} as {
        readonly [K in keyof StreamMap]: Stream.Stream.Success<StreamMap[K]>
      },
      (previous, { _tag: updatedParam, value: newParamValue }) => ({
        ...previous,
        [updatedParam]: newParamValue,
      }),
    ),
    Stream.tap(state =>
      Effect.log(
        `streamAll gathered keys ${Object.keys(state).length} / ${streamCount}: ${Object.keys(state).join(', ')}`,
      ),
    ),
    Stream.filter(state => Object.keys(state).length === streamCount),
  )
}
