/** biome-ignore-all lint/style/noNonNullAssertion: i dont care */
import type { TaggedPatternPointer } from '../domain/AssetPointer.ts'
import {
  isFullLoopQueue,
  isLoopRolloverHandoverQueue,
  isLoopSilenceHandoverQueue,
  isPlayingLoopQueue,
  isPlayingSlowStrumQueue,
  isSlowStrumHandoverQueue,
  type LoopBoundQueue,
} from '../services/AppPlaybackStateService/types/LoopBoundPlayback.ts'
import type { TupleIndices } from './TupleIndices.ts'

export function isValidQueueSignalSequence(queue: LoopBoundQueue) {
  if (isPlayingLoopQueue(queue)) return true
  if (isLoopRolloverHandoverQueue(queue))
    return valid2ElementsTransition(queue, 0, 1)

  if (isLoopSilenceHandoverQueue(queue))
    return valid2ElementsTransition(queue, 0, 1)
  if (isFullLoopQueue(queue)) return queue
  if (isPlayingSlowStrumQueue(queue)) return true
  if (isSlowStrumHandoverQueue(queue)) return queue
  throw new Error('wtf')
}

type SimpleAssetHolder = { asset: TaggedPatternPointer }

const valid2ElementsTransition = <
  TQueue extends readonly [
    SimpleAssetHolder,
    SimpleAssetHolder,
    ...SimpleAssetHolder[],
  ],
>(
  queue: TQueue,
  index1: TupleIndices<TQueue>,
  index2: TupleIndices<TQueue>,
) =>
  (queue[index1]!.asset.accord !== queue[index2]!.asset.accord &&
    queue[index1]!.asset.pattern === queue[index2]!.asset.pattern &&
    queue[index1]!.asset.strength === queue[index2]!.asset.strength) ||
  (queue[index1]!.asset.accord === queue[index2]!.asset.accord &&
    queue[index1]!.asset.pattern !== queue[index2]!.asset.pattern &&
    queue[index1]!.asset.strength === queue[index2]!.asset.strength) ||
  (queue[index1]!.asset.accord === queue[index2]!.asset.accord &&
    queue[index1]!.asset.pattern !== queue[index2]!.asset.pattern &&
    queue[index1]!.asset.strength === queue[index2]!.asset.strength)
