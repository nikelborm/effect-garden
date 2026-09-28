// @ts-check
import { serwist } from '@serwist/next/config'

export default serwist({
  swSrc: 'sw.ts',
  swDest: 'public/sw.js',
  // TODO: https://github.com/serwist/serwist/issues/54#issuecomment-5587874768
  //! remember to cleanup sw.js manually to not accidentally go precaching stuff
  // you never wanted to precache
})
