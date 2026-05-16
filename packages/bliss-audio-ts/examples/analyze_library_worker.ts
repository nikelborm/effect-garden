import { analyzeSong, isBlissError, type Song } from '../index.ts'

export type WorkerInMessage = {
  workerId: number
  paths: string[]
}

declare var self: Worker

export type WorkerOutMessage =
  | { type: 'result'; song: Song }
  | { type: 'error'; path: string; tag: string; message: string }
  | { type: 'progress'; workerId: number; done: number; total: number }
  | { type: 'done'; workerId: number }

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const { workerId, paths } = event.data
  const total = paths.length
  let done = 0

  for (const path of paths) {
    const result = analyzeSong(path)
    if (isBlissError(result)) {
      self.postMessage({
        type: 'error',
        path,
        tag: result._tag,
        message: result.message,
      } satisfies WorkerOutMessage)
    } else {
      // Transfer the ArrayBuffer so the main thread receives the Float32Array
      // without copying — the features buffer is detached here after postMessage
      self.postMessage(
        { type: 'result', song: result } satisfies WorkerOutMessage,
        [result.analysis.features.buffer],
      )
    }
    done++
    self.postMessage({
      type: 'progress',
      workerId,
      done,
      total,
    } satisfies WorkerOutMessage)
  }

  self.postMessage({ type: 'done', workerId } satisfies WorkerOutMessage)
}
