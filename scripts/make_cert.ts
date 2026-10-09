#!/usr/bin/env bun

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'

import { passthroughSpawn } from './lib/passthroughSpawn.ts'

const program = Effect.gen(function* () {
  yield* passthroughSpawn(
    'sudo',
    'mkdir',
    '-p',
    'certbot/conf/dhparam',
    'certbot/www',
    'certbot/logs',
  )

  yield* passthroughSpawn(
    'sudo',
    'docker',
    'run',
    '-it',
    '--rm',
    ...Object.entries({
      www: '/var/www/certbot/',
      conf: '/etc/letsencrypt/',
      logs: '/var/log/letsencrypt/',
    }).flatMap(([k, v]) => ['-v', `./certbot/${k}/:${v}:rw`]),
    '-p',
    '80:80',
    'certbot/certbot',
    'certonly',
    '--text',
    '--non-interactive',
    '--standalone',
    '--domain',
    '10111897.xyz',
    '--webroot-path',
    '/var/www/certbot/',
    '--agree-tos',
    '--email',
    'humped-churn-wipe@duck.com',
  )

  yield* passthroughSpawn(
    'sudo',
    'openssl',
    'dhparam',
    '-out',
    './certbot/conf/dhparam/dhparam.pem',
    '4096',
  )
}).pipe(
  Effect.scoped,
  Effect.provide(BunServices.layer),
  Effect.withSpan(import.meta.file),
  Effect.sandbox,
  Effect.catch(e => {
    console.error(Cause.pretty(e))

    return Effect.fail(e)
  }),
)

if (import.meta.main) BunRuntime.runMain(program)
