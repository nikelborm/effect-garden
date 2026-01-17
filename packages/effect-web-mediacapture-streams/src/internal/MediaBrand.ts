import * as Brand from 'effect/Brand'

export type AudioSinkId = Brand.Branded<string, 'AudioSinkId'>
export const AudioSinkId = Brand.refined<AudioSinkId>(
  id => typeof id === 'string',
  id => Brand.error(`Expected ${id} to be a string`),
)

export type DeviceId = Brand.Branded<string, 'DeviceId: non-empty string'>
export const DeviceId = Brand.refined<DeviceId>(
  id => typeof id === 'string' && !!id.length,
  id => Brand.error(`Expected device id ${id} to be a string`),
)

export type DeviceGroupId = Brand.Branded<
  string,
  'DeviceGroupId: non-empty string'
>
export const DeviceGroupId = Brand.refined<DeviceGroupId>(
  id => typeof id === 'string' && !!id.length,
  id => Brand.error(`Expected device group id ${id} to be a string`),
)

export type DeviceLabel = Brand.Branded<string, 'DeviceLabel: non-empty string'>
export const DeviceLabel = Brand.refined<DeviceLabel>(
  label => typeof label === 'string' && !!label.length,
  label => Brand.error(`Expected device label ${label} to be a string`),
)
