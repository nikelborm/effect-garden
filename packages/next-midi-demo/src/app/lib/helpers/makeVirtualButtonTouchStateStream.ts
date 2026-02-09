import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../branded/index.ts'

export const makeVirtualButtonTouchStateStream = <
  Ref extends GlobalEventHandlers,
>(
  keys: string[],
  ref?: Ref,
) => {
  const refWithFallback = ref ?? globalThis.window

  if (!refWithFallback) return Stream.empty
  return EFunction.pipe(
    Stream.fromEventListener<PointerEvent>(refWithFallback, 'pointerdown'),
    Stream.merge(
      Stream.fromEventListener<PointerEvent>(refWithFallback, 'pointermove'),
    ),
    Stream.merge(
      Stream.fromEventListener<PointerEvent>(refWithFallback, 'pointerup'),
    ),
    Stream.merge(
      Stream.fromEventListener<PointerEvent>(refWithFallback, 'pointercancel'),
    ),
    Stream.filterMap(event => {
      // assertElementWithDataset(event.target)

      return Option.some({
        eventType: event.type as
          | 'pointerdown'
          | 'pointermove'
          | 'pointerup'
          | 'pointercancel',
        clientX: event.clientX,
        clientY: event.clientY,
        pointerId: event.pointerId,
        target: event.target,
        currentTarget: event.currentTarget,
      })
    }),
    Stream.mapAccum(
      SortedMap.empty<number, Element | 'irrelevantElement'>(Order.number),
      (
        acc,
        { clientX, clientY, currentTarget, eventType, pointerId, target },
      ) => {
        const makePressStream = <T>(t: T) =>
          Stream.succeed([t, ButtonState.Pressed] as const)

        const makeReleaseStream = <T>(t: T) =>
          Stream.succeed([t, ButtonState.NotPressed] as const)

        const targetToGoodOption = (t: unknown) =>
          EFunction.pipe(
            Option.fromNullable(t),
            Option.filter(isElementWithDataset),
            Option.flatMapNullable(
              emergeUpToDesiredTarget(
                parentElement => parentElement !== currentTarget,
                keys,
              ),
            ),
          )

        if (eventType === 'pointerdown')
          return Option.match(targetToGoodOption(target), {
            onNone: () =>
              [
                SortedMap.set(acc, pointerId, 'irrelevantElement'),
                Stream.empty,
              ] as const,
            onSome: goodTarget =>
              [
                SortedMap.set(acc, pointerId, goodTarget),
                makePressStream(goodTarget),
              ] as const,
          })

        const previousElementOption = SortedMap.get(acc, pointerId)

        if (eventType === 'pointerup' || eventType === 'pointercancel')
          return [
            SortedMap.remove(acc, pointerId),
            previousElementOption.pipe(
              Option.filter(e => e !== 'irrelevantElement'),
              Option.match({
                onNone: () => Stream.empty,
                onSome: makeReleaseStream,
              }),
            ),
          ] as const

        if (Option.isNone(previousElementOption)) return [acc, Stream.empty]
        const previousElement = previousElementOption.value

        const releaseStreamOfPreviousElement =
          previousElement === 'irrelevantElement'
            ? Stream.empty
            : makeReleaseStream(previousElement)

        return EFunction.pipe(
          document.elementFromPoint(clientX, clientY),
          targetToGoodOption,
          Option.match({
            onSome: latestElement =>
              latestElement === previousElement
                ? [acc, Stream.empty]
                : [
                    SortedMap.set(acc, pointerId, latestElement),
                    Stream.concat(
                      makePressStream(latestElement),
                      releaseStreamOfPreviousElement,
                    ),
                  ],
            onNone: () => [
              SortedMap.set(acc, pointerId, 'irrelevantElement' as const),
              releaseStreamOfPreviousElement,
            ],
          }),
        )
      },
    ),
    Stream.flatten(),
  )
}

const emergeUpToDesiredTarget =
  (
    continueSearchWhile: (target: ElementWithDataset) => boolean,
    keysOfDatasetToLookFor: string[],
  ) =>
  (baseTarget: ElementWithDataset) => {
    let target: ElementWithDataset | null = baseTarget

    // event.currentTarget is something like root or html/body, anyone holding the
    // event listener. there's no point in going past the event listener
    while (target && continueSearchWhile(target)) {
      if (target.dataset)
        for (const k of keysOfDatasetToLookFor)
          if (k in target.dataset) return target

      target = target.parentElement as ElementWithDataset
    }

    return null
  }

interface ElementWithDataset extends Element {
  readonly dataset: DOMStringMap
}

const isElementWithDataset = (k: unknown): k is ElementWithDataset =>
  k instanceof Element && 'dataset' in k && k['dataset'] instanceof DOMStringMap
