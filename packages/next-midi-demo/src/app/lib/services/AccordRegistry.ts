import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  type AccordIndexUnion,
  decodeAccordIndexSync,
} from '../audioAssetHelpers.ts'
import { Accord, type AccordMiniInfo } from '../brandsAndDatas/Accord.ts'

const accords = [
  { id: 24, label: 'C' },
  { id: 25, label: 'Dm' },
  { id: 27, label: 'Em' },
  { id: 29, label: 'F' },
  { id: 31, label: 'G' },
  { id: 32, label: 'Am' },
  { id: 26, label: 'D' },
  { id: 28, label: 'E' },
] as const

const allAccords = accords.map((info, index) =>
  Accord.makeUnsafe({ ...info, index }),
) as unknown as AllAccordTuple

const mapIndexToAccord = (index: AccordIndexUnion) =>
  new Accord({ index, ...accords[index] }) as AllAccordUnion

export class AccordRegistry
  extends Effect.Service<AccordRegistry>()('next-midi-demo/AccordRegistry', {
    accessors: true,
    scoped: Effect.gen(function* () {
      const currentAccordIndexRef =
        yield* SubscriptionRef.make<AccordIndexUnion>(0)

      const selectedAccordChanges = yield* currentAccordIndexRef.changes.pipe(
        Stream.changes,
        Stream.rechunk(1),
        Stream.map(mapIndexToAccord),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      return {
        currentlySelectedAccord: Effect.map(
          currentAccordIndexRef.get,
          mapIndexToAccord,
        ),
        allAccords: Effect.succeed(allAccords),
        selectedAccordChanges,
        selectAccord: (accordIndex: AccordIndexUnion) => {
          const trustedIndex = decodeAccordIndexSync(accordIndex)

          return SubscriptionRef.set(currentAccordIndexRef, trustedIndex)
        },
        getAccordByIndex: (accordIndex: AccordIndexUnion) =>
          allAccords[decodeAccordIndexSync(accordIndex)],
      }
    }),
  })
  implements IAccordRegistry {}

interface IAccordRegistry {
  readonly currentlySelectedAccord: Effect.Effect<AllAccordUnion>
  readonly allAccords: Effect.Effect<AllAccordTuple>
  readonly selectedAccordChanges: Stream.Stream<AllAccordUnion>
  readonly selectAccord: (accordIndex: AccordIndexUnion) => Effect.Effect<void>
}

type _AllAccordTuple<
  Labels extends readonly AccordMiniInfo[] = typeof accords,
> = Labels extends readonly [
  ...infer RestLabels extends readonly AccordMiniInfo[],
  infer Current extends AccordMiniInfo,
]
  ? readonly [
      ..._AllAccordTuple<RestLabels>,
      Accord<
        Current['id'],
        Current['label'],
        Extract<RestLabels['length'], AccordIndexUnion>
      >,
    ]
  : readonly []

export type AllAccordTuple = _AllAccordTuple

export type AllAccordUnion = AllAccordTuple[number]
