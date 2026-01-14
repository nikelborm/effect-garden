import withSerwistInit from '@serwist/next'
import withLinaria, { type LinariaConfig } from 'next-with-linaria'

import { pipe } from 'effect/Function'

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.mts', // Your worker source
  swDest: 'public/sw.js', // Where the compiled worker goes
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: LinariaConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  experimental: {
    // turbopackFileSystemCacheForDev: true,
    // turbopackFileSystemCacheForBuild: true,
  },
  typedRoutes: true,

  // turbopack: {
  //   rules: {
  //     '*.wav': {
  //       loaders: ['file-loader'],
  //       as: 'url',
  //     },
  //   },
  // },

  // probably will be needed later for some of the internal libraries
  // transpilePackages: ['package-name'],
  poweredByHeader: false,
  compress: false, // should be handled by nginx
  // linaria: {}
}

export default pipe(nextConfig, withLinaria, withSerwist)
