import * as EFunction from 'effect/Function'
import * as Iterable from 'effect/Iterable'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as Schema from 'effect/Schema'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../branded/index.ts'

export const OptionalProperty = Schema.optionalWith({ exact: true }) as <
  S extends Schema.Schema.All,
>(
  self: S,
) => Schema.optionalWith<S, { exact: true }>

export const makeVirtualButtonTouchStateStream = <
  const DatasetKeys extends string,
>(
  keysOfDatasetToLookFor: Set<DatasetKeys>,
  ref?: GlobalEventHandlers,
) => {
  const refWithFallback = ref ?? globalThis.window

  if (!refWithFallback) return Stream.empty

  type IsNonDistributableUnion<A> = [A] extends [infer U]
    ? U extends any // distribute
      ? A extends U // if only one key in a union (full union can be assigned to any union element)
        ? true
        : false
      : never
    : never

  type Dataset =
    IsNonDistributableUnion<DatasetKeys> extends true
      ? { readonly [datasetKey in DatasetKeys]-?: string }
      : { readonly [datasetKey in DatasetKeys]+?: string }

  const DatasetSchema = Schema.Struct(
    Object.fromEntries(
      Array.from(keysOfDatasetToLookFor, key => [
        key,
        OptionalProperty(Schema.String),
      ]),
    ),
  )

  return EFunction.pipe(
    Stream.fromEventListener<PointerEvent>(refWithFallback, 'pointerdown', {
      bufferSize: 'unbounded',
    }),
    Stream.merge(
      Stream.fromEventListener<PointerEvent>(refWithFallback, 'pointermove', {
        bufferSize: 'unbounded',
      }),
    ),
    Stream.merge(
      Stream.fromEventListener<PointerEvent>(refWithFallback, 'pointerup', {
        bufferSize: 'unbounded',
      }),
    ),
    Stream.merge(
      Stream.fromEventListener<PointerEvent>(refWithFallback, 'pointercancel', {
        bufferSize: 'unbounded',
      }),
    ),
    Stream.mapAccum(
      SortedMap.empty<number, ElementWithDataset | 'irrelevantElement'>(
        Order.number,
      ),
      (acc, { clientX, clientY, currentTarget, type, pointerId, target }) => {
        const eventType = type as
          | 'pointerdown'
          | 'pointermove'
          | 'pointerup'
          | 'pointercancel'
        const makePressStream = <T>(t: T) =>
          Stream.succeed([t, ButtonState.Pressed] as const)

        const makeReleaseStream = <T>(t: T) =>
          Stream.succeed([t, ButtonState.NotPressed] as const)

        const getTargetWithDesiredDataset = (t: unknown) =>
          EFunction.pipe(
            Option.fromNullable(t),
            Option.filter(isElementWithDataset),
            Option.flatMapNullable(
              emergeUpToDesiredTarget(
                parentElement => parentElement !== currentTarget,
                keysOfDatasetToLookFor,
              ),
            ),
          )

        if (eventType === 'pointerdown')
          return Option.match(getTargetWithDesiredDataset(target), {
            onNone: () =>
              [
                SortedMap.set(acc, pointerId, 'irrelevantElement'),
                Stream.empty,
              ] as const,
            onSome: elementWithDesiredDataset =>
              [
                SortedMap.set(acc, pointerId, elementWithDesiredDataset),
                Iterable.some(acc, ([, el]) => el === elementWithDesiredDataset)
                  ? Stream.empty
                  : makePressStream(elementWithDesiredDataset),
              ] as const,
          })

        const previousElementOption = SortedMap.get(acc, pointerId)
        const mapWithoutCurrentPointerId = SortedMap.remove(acc, pointerId)

        if (eventType === 'pointerup' || eventType === 'pointercancel') {
          return [
            mapWithoutCurrentPointerId,
            previousElementOption.pipe(
              Option.filter(e => e !== 'irrelevantElement'),
              Option.match({
                onNone: () => Stream.empty,
                onSome: elementWithDesiredDataset =>
                  Iterable.some(
                    mapWithoutCurrentPointerId,
                    ([, el]) => el === elementWithDesiredDataset,
                  )
                    ? Stream.empty
                    : makeReleaseStream(elementWithDesiredDataset),
              }),
            ),
          ] as const
        }

        if (Option.isNone(previousElementOption)) return [acc, Stream.empty]
        const previousElement = previousElementOption.value

        const releaseStreamOfPreviousElement =
          previousElement === 'irrelevantElement'
            ? Stream.empty
            : Iterable.some(
                  mapWithoutCurrentPointerId,
                  ([, el]) => el === previousElement,
                )
              ? Stream.empty
              : makeReleaseStream(previousElement)

        return EFunction.pipe(
          document.elementFromPoint(clientX, clientY),
          getTargetWithDesiredDataset,
          Option.match({
            onSome: latestElement => {
              if (latestElement === previousElement) return [acc, Stream.empty]
              if (previousElement === 'irrelevantElement')
                return [
                  SortedMap.set(acc, pointerId, latestElement),
                  Iterable.some(
                    mapWithoutCurrentPointerId,
                    ([, el]) => el === latestElement,
                  )
                    ? Stream.empty
                    : makePressStream(latestElement),
                ]

              return [
                SortedMap.set(acc, pointerId, latestElement),
                Stream.concat(
                  Iterable.some(acc, ([, el]) => el === latestElement)
                    ? Stream.empty
                    : makePressStream(latestElement),
                  Iterable.some(
                    mapWithoutCurrentPointerId,
                    ([, el]) => el === previousElement,
                  )
                    ? Stream.empty
                    : makeReleaseStream(previousElement),
                ),
              ]
            },
            onNone: () => [
              SortedMap.set(acc, pointerId, 'irrelevantElement' as const),
              releaseStreamOfPreviousElement,
            ],
          }),
        )
      },
    ),
    Stream.flatten(),
    Stream.map(
      ([e, state]) =>
        [
          Schema.decodeUnknownSync(DatasetSchema)(e.dataset) as Dataset,
          state,
        ] as const,
    ),
  )
}

const emergeUpToDesiredTarget =
  (
    continueSearchWhile: (target: ElementWithDataset) => boolean,
    keysOfDatasetToLookFor: Set<string>,
  ) =>
  (baseTarget: ElementWithDataset) => {
    let target: ElementWithDataset | null = baseTarget

    // event.currentTarget is something like root or html/body, anyone holding the
    // event listener. there's no point in going past the event listener
    while (target && continueSearchWhile(target)) {
      if (target.dataset)
        for (const keyCandidate of keysOfDatasetToLookFor)
          if (keyCandidate in target.dataset) return target

      target = target.parentElement as ElementWithDataset
    }

    return null
  }

interface ElementWithDataset extends Element {
  readonly dataset: DOMStringMap
}

const isElementWithDataset = (k: unknown): k is ElementWithDataset =>
  k instanceof Element && 'dataset' in k && k['dataset'] instanceof DOMStringMap
