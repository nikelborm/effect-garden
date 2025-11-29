import * as EArray from 'effect/Array'
import { pipe } from 'effect/Function'
import * as Record from 'effect/Record'
import * as Stream from 'effect/Stream'

export const mapToGlidingStringLogOfLimitedEntriesCount =
  <A>(
    windowSize: number,
    show: 'latestFirst' | 'oldestFirst',
    objectify: (current: NoInfer<A>) => object,
  ) =>
  <E, R>(self: Stream.Stream<A, E, R>) => {
    if (windowSize < 1) throw new Error('Window size should be greater than 0')

    return Stream.mapAccum(
      self,
      { text: '', entrySizeLog: [] as number[] },
      ({ entrySizeLog: oldLog, text: oldText }, current) => {
        const currMapped =
          pipe(
            objectify(current),
            Record.toEntries,
            EArray.map(EArray.join(': ')),
            EArray.join(', '),
          ) + '\n'

        const potentiallyShiftedLog =
          oldLog.length >= windowSize
            ? oldLog.slice(...(show === 'latestFirst' ? [0, -1] : [1]))
            : oldLog

        const potentiallyShiftedText =
          oldLog.length >= windowSize
            ? oldText.slice(
                ...(show === 'latestFirst'
                  ? // biome-ignore lint/style/noNonNullAssertion: oldLog guaranteed to have at least one element by oldLog.length >= windowSize
                    [0, -oldLog.at(-1)! - 1]
                  : // biome-ignore lint/style/noNonNullAssertion: oldLog guaranteed to have at least one element by oldLog.length >= windowSize
                    [oldLog.at(0)! + 1]),
              )
            : oldText

        const text =
          show === 'latestFirst'
            ? currMapped + potentiallyShiftedText
            : potentiallyShiftedText + currMapped

        const entrySizeLog =
          show === 'latestFirst'
            ? [currMapped.length, ...potentiallyShiftedLog]
            : [...potentiallyShiftedLog, currMapped.length]

        return [{ text, entrySizeLog }, text]
      },
    )
  }
