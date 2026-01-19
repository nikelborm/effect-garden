/** biome-ignore-all lint/correctness/noUnusedVariables: it's a prototype, so I don't care for now> */
'use client'

import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import * as EMIDIOutput from 'effect-web-midi/EMIDIOutput'

import { Atom, useAtom } from '@effect-atom/atom-react'

import { nanoPadOutputId } from './ports.ts'

const globalDataDumpRequest = new Uint8Array([
  0xf0, 0x42, 0x40 /* 4g */,
  //
  0x00, 0x01, 0x03, 0x00,
  //
  0x1f, 0x0e, 0x00, 0xf7,
])

const dumpRequester = Atom.fn(() =>
  EMIDIAccess.request({ sysex: true }).pipe(
    EMIDIAccess.getOutputByIdInPipe(nanoPadOutputId),
    EMIDIOutput.send(globalDataDumpRequest),
  ),
)

export const useDumpRequester = () => {
  const [dumpRequestState, requestDump] = useAtom(dumpRequester)
  return { requestDump, dumpRequestState }
}
