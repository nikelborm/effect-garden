import { expect, it, test } from '@effect/vitest'
import * as Effect from 'effect/Effect'

import * as Aliyun from '../src/Aliyun.ts'

/**
 * The worked example from Alibaba's Signature Version 1.0 documentation. If
 * this drifts, every signed request is rejected, so it is worth pinning even
 * though the parameters are unrelated to billing.
 */
const documentedRequest = {
  AccessKeyId: 'testid',
  Action: 'DescribeRegions',
  Format: 'XML',
  SignatureMethod: 'HMAC-SHA1',
  SignatureNonce: '3ee8c1b8-83d3-44af-a94f-4e0ad82fd6cf',
  SignatureVersion: '1.0',
  Timestamp: '2016-02-23T12:46:24Z',
  Version: '2014-05-26',
}

test('canonicalises parameters in sorted order with the strict unreserved set', () => {
  expect(Aliyun.canonicalizeQuery(documentedRequest)).toBe(
    'AccessKeyId=testid&Action=DescribeRegions&Format=XML&SignatureMethod=HMAC-SHA1' +
      '&SignatureNonce=3ee8c1b8-83d3-44af-a94f-4e0ad82fd6cf&SignatureVersion=1.0' +
      '&Timestamp=2016-02-23T12%3A46%3A24Z&Version=2014-05-26',
  )
})

it.effect('reproduces the signature from the documented example', () =>
  Effect.gen(function* () {
    expect(
      yield* Aliyun.sign(
        'testsecret',
        'GET',
        Aliyun.canonicalizeQuery(documentedRequest),
      ),
    ).toBe('OLeaidS1JvxuMvnyHOwuJ+uX5qY=')
  }),
)

test('escapes the characters encodeURIComponent leaves alone', () => {
  // Alibaba treats only A-Za-z0-9-_.~ as unreserved.
  expect(Aliyun.alibabaEncodeURIComponent("a!b'c(d)e*f")).toBe(
    'a%21b%27c%28d%29e%2Af',
  )
  expect(Aliyun.alibabaEncodeURIComponent('~-_.')).toBe('~-_.')
})
