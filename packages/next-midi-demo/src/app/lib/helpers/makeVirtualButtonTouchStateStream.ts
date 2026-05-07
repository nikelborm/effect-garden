import { OptionalProperty } from '@nikelborm/effect-helpers'

import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Iterable from 'effect/Iterable'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'

import {
  type AllSimple,
  NotPressed,
  Pressed,
} from '../brandsAndDatas/ButtonState.ts'

export const makeVirtualButtonTouchStateStream = <
  const DatasetKeys extends string,
>(
  keysOfDatasetToLookFor: Set<DatasetKeys>,
  ref?: GlobalEventHandlers,
) => {
  const refWithFallback = ref ?? globalThis.window

  if (!refWithFallback) return Stream.empty

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

  const makePointerEventStream = (type: EventType) =>
    Stream.fromEventListener<TypedPointerEvent>(refWithFallback, type, {
      bufferSize: 'unbounded',
    })

  return makePointerEventStream('pointerdown').pipe(
    Stream.merge(makePointerEventStream('pointermove')),
    Stream.merge(makePointerEventStream('pointerup')),
    Stream.merge(makePointerEventStream('pointercancel')),
    Stream.mapAccum(HashMap.empty<number, ElementOrOther>(), (oldMap, ev) => {
      //                          ^ pointerId
      const { clientX, clientY, type, currentTarget, pointerId, target } = ev

      const getTargetWithGoodDataset = EFunction.flow(
        Option.fromNullable<unknown>,
        Option.filter(isElementWithDataset),
        Option.flatMapNullable(
          emergeUpToDesiredTarget(
            parentElement => parentElement !== currentTarget,
            keysOfDatasetToLookFor,
          ),
        ),
      )

      if (type === 'pointerdown') {
        const latestElement = getValueOrOther(getTargetWithGoodDataset(target))
        return [
          HashMap.set(oldMap, pointerId, latestElement),
          makeStreamWithElementIfMapDidntHaveIt(oldMap, latestElement, Pressed),
        ]
      }

      // Realistically pointerId guaranteed to be in oldMap. We can't expect
      // finger to release or move away from something it haven't been touching
      // in the first place. We don't crash, just ignore
      const oldElement = getValueOrOther(HashMap.get(oldMap, pointerId))
      const mapWithoutCurrentPointerId = HashMap.remove(oldMap, pointerId)

      if (type === 'pointerup' || type === 'pointercancel')
        return [
          mapWithoutCurrentPointerId,
          makeStreamWithElementIfMapDidntHaveIt(
            mapWithoutCurrentPointerId,
            oldElement,
            NotPressed,
          ),
        ]

      // type === 'pointermove'...

      const latestElement = EFunction.pipe(
        document.elementFromPoint(clientX, clientY),
        getTargetWithGoodDataset,
        getValueOrOther,
      )

      const newMap = HashMap.set(oldMap, pointerId, latestElement)

      return [
        newMap,
        Stream.concat(
          makeStreamWithElementIfMapDidntHaveIt(newMap, oldElement, NotPressed),
          makeStreamWithElementIfMapDidntHaveIt(oldMap, latestElement, Pressed),
        ),
      ]
    }),
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

const makeStreamWithElementIfMapDidntHaveIt = (
  map: HashMap.HashMap<number, ElementOrOther>,
  elementToLookFor: ElementOrOther,
  state: AllSimple,
) =>
  elementToLookFor === other ||
  Iterable.some(map, ([, el]) => el === elementToLookFor)
    ? Stream.empty
    : Stream.succeed([elementToLookFor, state] as const)

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
const other: unique symbol = Symbol('Other')
const getValueOrOther = Option.getOrElse(EFunction.constant(other))
type ElementOrOther = ElementWithDataset | typeof other
type TypedPointerEvent = PointerEvent & { readonly type: EventType }
type EventType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel'

type IsNonDistributableUnion<A> = [A] extends [infer U]
  ? U extends any // distribute type
    ? A extends U // if only one key in a union (full union can be assigned to any union element)
      ? true
      : false
    : never
  : never

const isElementWithDataset = (k: unknown): k is ElementWithDataset =>
  k instanceof Element && 'dataset' in k && k['dataset'] instanceof DOMStringMap

// pointermove verified by:
// import * as Data from 'effect/Data'
// import * as Record from 'effect/Record'
// import * as Equal from 'effect/Equal'
// import * as HashSet from 'effect/HashSet';

// const pressE1 =   Data.tuple('e1' as const, 'press'     as const)
// const pressE2 =   Data.tuple('e2' as const, 'press'     as const)
// const releaseE1 = Data.tuple('e1' as const, 'not press' as const)
// const releaseE2 = Data.tuple('e2' as const, 'not press' as const)

// // null means irrelevant.
// const tests = [
//   // pointerId   prevContext             latestElement expectedResult
//   [ 1,           {                  },   null,        []                  ],
//   [ 1,           {                  },   'e1',        [pressE1]           ],
//   [ 1,           {                  },   'e2',        [pressE2]           ],
//   [ 1,           {          2: null },   null,        []                  ],
//   [ 1,           {          2: null },   'e1',        [pressE1]           ],
//   [ 1,           {          2: null },   'e2',        [pressE2]           ],
//   [ 1,           {          2: 'e1' },   null,        []                  ],
//   [ 1,           {          2: 'e1' },   'e1',        []                  ],
//   [ 1,           {          2: 'e1' },   'e2',        [pressE2]           ],
//   [ 1,           {          2: 'e2' },   null,        []                  ],
//   [ 1,           {          2: 'e2' },   'e1',        [pressE1]           ],
//   [ 1,           {          2: 'e2' },   'e2',        []                  ],

//   [ 1,           { 1: null,         },   null,        []                  ],
//   [ 1,           { 1: null,         },   'e1',        [pressE1]           ],
//   [ 1,           { 1: null,         },   'e2',        [pressE2]           ],
//   [ 1,           { 1: null, 2: null },   null,        []                  ],
//   [ 1,           { 1: null, 2: null },   'e1',        [pressE1]           ],
//   [ 1,           { 1: null, 2: null },   'e2',        [pressE2]           ],
//   [ 1,           { 1: null, 2: 'e1' },   null,        []                  ],
//   [ 1,           { 1: null, 2: 'e1' },   'e1',        []                  ],
//   [ 1,           { 1: null, 2: 'e1' },   'e2',        [pressE2]           ],
//   [ 1,           { 1: null, 2: 'e2' },   null,        []                  ],
//   [ 1,           { 1: null, 2: 'e2' },   'e1',        [pressE1]           ],
//   [ 1,           { 1: null, 2: 'e2' },   'e2',        []                  ],

//   [ 1,           { 1: 'e1',         },   null,        [releaseE1]         ],
//   [ 1,           { 1: 'e1',         },   'e1',        []                  ],
//   [ 1,           { 1: 'e1',         },   'e2',        [releaseE1,pressE2] ],
//   [ 1,           { 1: 'e1', 2: null },   null,        [releaseE1]         ],
//   [ 1,           { 1: 'e1', 2: null },   'e1',        []                  ],
//   [ 1,           { 1: 'e1', 2: null },   'e2',        [releaseE1,pressE2] ],
//   [ 1,           { 1: 'e1', 2: 'e1' },   null,        []                  ],
//   [ 1,           { 1: 'e1', 2: 'e1' },   'e1',        []                  ],
//   [ 1,           { 1: 'e1', 2: 'e1' },   'e2',        [pressE2]           ],
//   [ 1,           { 1: 'e1', 2: 'e2' },   null,        [releaseE1]         ],
//   [ 1,           { 1: 'e1', 2: 'e2' },   'e1',        []                  ],
//   [ 1,           { 1: 'e1', 2: 'e2' },   'e2',        [releaseE1]         ],

//   [ 1,           { 1: 'e2',         },   null,        [releaseE2]         ],
//   [ 1,           { 1: 'e2',         },   'e1',        [releaseE2,pressE1] ],
//   [ 1,           { 1: 'e2',         },   'e2',        []                  ],
//   [ 1,           { 1: 'e2', 2: null },   null,        [releaseE2]         ],
//   [ 1,           { 1: 'e2', 2: null },   'e1',        [releaseE2,pressE1] ],
//   [ 1,           { 1: 'e2', 2: null },   'e2',        []                  ],
//   [ 1,           { 1: 'e2', 2: 'e1' },   null,        [releaseE2]         ],
//   [ 1,           { 1: 'e2', 2: 'e1' },   'e1',        [releaseE2]         ],
//   [ 1,           { 1: 'e2', 2: 'e1' },   'e2',        []                  ],
//   [ 1,           { 1: 'e2', 2: 'e2' },   null,        []                  ],
//   [ 1,           { 1: 'e2', 2: 'e2' },   'e1',        [pressE1]           ],
//   [ 1,           { 1: 'e2', 2: 'e2' },   'e2',        []                  ]
// ] as const

// const algo = ([pointerId, prevContext, latestElement]: (typeof tests)[number]) => {
//   const makeStreamWithElementIfMapDidntHaveIt = ( map: any, elementToLookFor: any, state: any,) =>
//     Object.entries(map).some(([, el]) => el === elementToLookFor)
//       ? HashSet.empty()
//       : HashSet.make(Data.tuple(elementToLookFor, state))

//   const previousElement = prevContext[pointerId] ?? null

//   const updatedMap = Record.set(prevContext, pointerId.toString(), latestElement)

//   return HashSet.union(
//     previousElement === null
//       ? HashSet.empty()
//       : makeStreamWithElementIfMapDidntHaveIt(
//           updatedMap,
//           previousElement,
//           'not press',
//         ),
//     latestElement === null
//       ? HashSet.empty()
//       : // нужно чтобы переданная карта содержала latestElement
//         makeStreamWithElementIfMapDidntHaveIt(
//           prevContext,
//           latestElement,
//           'press',
//         ),
//   )
// }

// for (const test of tests)
//   if (!Equal.equals(algo(test), HashSet.fromIterable(test[3])))
//     throw new Error('failed', test)

// console.log('success')
