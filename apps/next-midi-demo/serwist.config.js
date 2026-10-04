// @ts-check
import { serwist } from '@serwist/next/config'

export default serwist({
  swSrc: 'public/sw.ts',
  swDest: 'public/sw.js',
  globIgnores: ['public/samples/**'],
})
