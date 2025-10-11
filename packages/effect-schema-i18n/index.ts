import * as Effect from 'effect/Effect';
import * as JSONSchema from 'effect/JSONSchema';
import * as Schema from 'effect/Schema';

const asd = Schema.Struct({
  asd_property1: Schema.String.annotations({
    identifier: '@identifier/asd_property1',
    schemaId: 'asd_property1 english schemaId',
    title: 'asd_property1 english title',
    description: 'asd_property1 english description',
    documentation: 'asd_property1 english documentation',
    examples: [
      'asd_property1 example english hello',
      'asd_property1 example english world',
    ],
    message: () => 'asd_property1 english message',
    parseIssueTitle: () => 'asd_property1 english parseIssueTitle',
  }),
  asd_property2: Schema.Number.annotations({
    identifier: '@identifier/asd_property2',
    schemaId: 'asd_property2 english schemaId',
    title: 'asd_property2 english title',
    description: 'asd_property2 english description',
    documentation: 'asd_property2 english documentation',
    examples: [1, 2, 3],
    message: () => 'asd_property2 english message',
    parseIssueTitle: () => 'asd_property2 english parseIssueTitle',
  }),
  'asd/asd': Schema.Date,
}).annotations({
  identifier: '@identifier/asd_struct',
  examples: [
    { asd_property1: 'hello english', asd_property2: 1, 'asd/asd': new Date() },
    { asd_property1: 'world english', asd_property2: 2, 'asd/asd': new Date() },
  ],
  schemaId: 'asd_struct english schemaId',
  title: 'asd_struct english title',
  description: 'asd_struct english description',
  documentation: 'asd_struct english documentation',
  message: () => 'asd_struct english message',
  parseIssueTitle: () => 'asd_struct english parseIssueTitle',
});

const asd2 = Schema.transform(asd, asd, {
  strict: true,
  decode(fromA, fromI) {
    return fromI;
  },
  encode(toI, toA) {
    return toA;
  },
});

// console.log(JSON.stringify(JSONSchema.make(asd), null, 2));
// console.log(JSONSchema.make(asd2));
console.log(asd.annotations!.toString());
