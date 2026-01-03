/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

const sw = self as unknown as ServiceWorkerGlobalScope

const serwist = new Serwist({
  ...(sw.__SW_MANIFEST ? { precacheEntries: sw.__SW_MANIFEST } : {}),

  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache, // Standard strategies for fonts/images/apis
})

serwist.addEventListeners()
