import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as Layer from 'effect/Layer'

import { makeCookieAwareLayer } from './client.ts'
import { makeLayer as makeConfigLayer } from './config.ts'

export const makeYTMusicLayer = (options?: {
  GL?: string
  HL?: string
  cookies?: string
}) => {
  const { cookies, ...configOptions } = options ?? {}
  return Layer.mergeAll(
    makeConfigLayer(configOptions),
    makeCookieAwareLayer(cookies),
  ).pipe(Layer.provide(FetchHttpClient.layer))
}
