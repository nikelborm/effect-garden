import { OptionalProperty } from '@evadev/effect-helpers'
import parseLinkHeaderToObject from 'parse-link-header'

import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Schema from 'effect/Schema'

import { ParseLinkHeaderError } from './errors.ts'

const linkField = <const T extends string>(name: T) =>
  Schema.Struct({
    per_page: Schema.NumberFromString,
    page: Schema.NumberFromString,
    rel: Schema.Literal(name),
    direction: Schema.Literal('asc', 'desc'),
    sort: Schema.Literal('updated', 'created'),
    url: Schema.URL,
  })
    .annotations({ title: 'Link' })
    .pipe(OptionalProperty)

export class LinkHeader extends Schema.TaggedError<LinkHeader>()('LinkHeader', {
  prev: linkField('prev'),
  next: linkField('next'),
  last: linkField('last'),
  first: linkField('first'),
}) {}

export const parseLinkHeader = (linkHeader: string | null | undefined) =>
  pipe(
    linkHeader,
    parseLinkHeaderToObject,
    Schema.decodeUnknown(LinkHeader),
    Effect.mapError(
      parseError => new ParseLinkHeaderError({ linkHeader, cause: parseError }),
    ),
  )
