import * as Brand from 'effect/Brand'
import * as Schema from 'effect/Schema'
// import * as Order from 'effect/Order'

export type InHertz = Brand.Branded<number, 'InHertz'>
export const InHertz = Brand.check<InHertz>(Schema.isFinite())

export type SampleRate = Brand.Branded<
  InHertz,
  'SampleRate: positive non-zero float'
>
export const SampleRate = Brand.all(
  InHertz,
  Brand.check<SampleRate>(Schema.isGreaterThan(0)),
)

export type SampleFrameAmount = Brand.Branded<
  number,
  'SampleFrameAmount: positive non-zero integer'
>

export const SampleFrameAmount = Brand.check<SampleFrameAmount>(
  Schema.isInt(),
  Schema.isGreaterThan(0),
)

export type ChannelAmount = Brand.Branded<
  number,
  'ChannelAmount: positive non-zero integer'
>
export const ChannelAmount = Brand.check<ChannelAmount>(
  Schema.isInt(),
  Schema.isGreaterThan(0),
)

export type ChannelIndex = Brand.Branded<
  number,
  'ChannelIndex: positive integer'
>
export const ChannelIndex = Brand.check<ChannelIndex>(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
)

export type PositiveSeconds = Brand.Branded<
  number,
  'PositiveSeconds: positive non-zero float'
>
export const PositiveSeconds = Brand.check<PositiveSeconds>(
  Schema.isFinite(),
  Schema.isGreaterThan(0),
)
