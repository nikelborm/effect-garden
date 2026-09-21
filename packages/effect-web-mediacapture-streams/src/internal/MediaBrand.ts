import * as Brand from 'effect/Brand'
import * as Schema from 'effect/Schema'

const isStringFilter = Schema.makeFilter<string>(
  id => typeof id === 'string' || `Expected ${id} to be a string`,
)

export type AudioSinkId = Brand.Branded<string, 'AudioSinkId'>
export const AudioSinkId: Brand.Constructor<AudioSinkId> =
  Brand.check<AudioSinkId>(isStringFilter)

export type DeviceId = Brand.Branded<string, 'DeviceId: non-empty string'>
export const DeviceId: Brand.Constructor<DeviceId> = Brand.check<DeviceId>(
  isStringFilter,
  Schema.isNonEmpty(),
)

export type DeviceGroupId = Brand.Branded<
  string,
  'DeviceGroupId: non-empty string'
>
export const DeviceGroupId: Brand.Constructor<DeviceGroupId> =
  Brand.check<DeviceGroupId>(isStringFilter, Schema.isNonEmpty())

export type DeviceLabel = Brand.Branded<string, 'DeviceLabel: non-empty string'>
export const DeviceLabel: Brand.Constructor<DeviceLabel> =
  Brand.check<DeviceLabel>(isStringFilter, Schema.isNonEmpty())
