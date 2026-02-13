import type { NextConfig } from 'next'
import { withYak } from 'next-yak/withYak'

import { pipe } from 'effect/Function'

const nextConfig: NextConfig = {
  headers() {
    return [
      {
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
  experimental: {},
  typedRoutes: true,
  poweredByHeader: false,
  compress: false,
}

export default pipe(nextConfig, withYak)
