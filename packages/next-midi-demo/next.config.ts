import withLinaria, { type LinariaConfig } from 'next-with-linaria'

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

export default withLinaria(nextConfig)
