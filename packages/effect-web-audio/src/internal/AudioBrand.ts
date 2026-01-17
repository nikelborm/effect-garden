import * as Brand from 'effect/Brand'
// import * as Order from 'effect/Order'

export type InHertz = Brand.Branded<number, 'InHertz'>
export const InHertz = Brand.refined<InHertz>(
  hz => typeof hz === 'number',
  hz => Brand.error(`Expected ${hz} to be a number`),
)

export type SampleRate = Brand.Branded<
  InHertz,
  'SampleRate: positive non-zero float'
>
export const SampleRate = Brand.all(
  InHertz,
  Brand.refined<SampleRate>(
    rate => rate > 0,
    rate => Brand.error(`Expected sample rate ${rate} to be greater than 0`),
  ),
)

export type SampleFrameAmount = Brand.Branded<
  number,
  'SampleFrameAmount: positive non-zero integer'
>
export const SampleFrameAmount = Brand.refined<SampleFrameAmount>(
  amount => Number.isSafeInteger(amount) && amount > 0,
  amount =>
    Brand.error(
      `Expected sample-frame amount ${amount} to be an integer greater than 0`,
    ),
)

export type ChannelAmount = Brand.Branded<
  number,
  'ChannelAmount: positive non-zero integer'
>
export const ChannelAmount = Brand.refined<ChannelAmount>(
  amount => Number.isSafeInteger(amount) && amount > 0,
  amount =>
    Brand.error(
      `Expected channel amount ${amount} to be an integer greater than 0`,
    ),
)

export type ChannelIndex = Brand.Branded<
  number,
  'ChannelIndex: positive integer'
>
export const ChannelIndex = Brand.refined<ChannelIndex>(
  amount => Number.isSafeInteger(amount) && amount >= 0,
  amount =>
    Brand.error(
      `Expected channel index ${amount} to be an integer greater than 0`,
    ),
)

export type PositiveSeconds = Brand.Branded<
  number,
  'PositiveSeconds: positive non-zero number'
>
export const PositiveSeconds = Brand.refined<PositiveSeconds>(
  amount => typeof amount === 'number' && amount > 0,
  amount =>
    Brand.error(`Expected seconds ${amount} to be a number greater than 0`),
)
