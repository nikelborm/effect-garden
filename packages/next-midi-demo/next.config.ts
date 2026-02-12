import withSerwistInit from '@serwist/next'
import type { NextConfig } from 'next'
import { withYak } from 'next-yak/withYak'

import { pipe } from 'effect/Function'

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',

  // This prevents files in /public/samples from being precached
  exclude: [
    // default exclusion:
    /\.map$/,
    /^manifest.*\.js$/,
    // Excludes everything in public/samples
    /^samples\/.*$/,
  ],
})

const nextConfig: NextConfig = {
  headers() {
    return [
      {
        // Match all files under /samples/
        source: '/samples/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ]
  },
  reactCompiler: true,
  // output: 'standalone',
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
}

export default pipe(nextConfig, withYak, withSerwist)
