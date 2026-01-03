import withSerwistInit from '@serwist/next'
import { pipe } from 'effect/Function'
import withLinaria, { type LinariaConfig } from 'next-with-linaria'

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

  // probably will be needed later for some of the internal libraries
  // transpilePackages: ['package-name'],
  poweredByHeader: false,
  compress: false, // should be handled by nginx
  // linaria: {}
}

export default pipe(nextConfig, withLinaria, withSerwist)
