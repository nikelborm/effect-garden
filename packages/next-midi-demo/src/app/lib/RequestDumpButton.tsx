import { Result } from '@effect-atom/atom'
import * as Cause from 'effect/Cause'
import { useDumpRequester } from './useDumpRequester.ts'

export const RequestDumpButton = () => {
  const { requestDump, dumpRequestState } = useDumpRequester()

  return (
    <>
      <button type="button" onClick={() => requestDump()}>
        Request dump
      </button>
      {Result.match(dumpRequestState, {
        onFailure: _ => (
          <pre>
            Request dump failure:{'\n'}
            {Cause.pretty(_.cause)}
            {'\n'}
          </pre>
        ),
        onInitial: () => <></>,
        onSuccess: () => <></>,
      })}
    </>
  )
}
