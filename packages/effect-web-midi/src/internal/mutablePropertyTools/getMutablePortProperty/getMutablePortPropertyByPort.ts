import * as Effect from 'effect/Effect'
import type * as EMIDIPort from '../../EMIDIPort.ts'
import type { MIDIPortMutableProperty } from '../matchMutablePortProperty/matchMutablePortPropertyByPort.ts'
import { getValueInRawPortFieldUnsafe } from '../getValueInRawPortFieldUnsafe.ts'

/**
 * @internal
 */
const getMutableProperty =
  <TMIDIPortType extends MIDIPortType>() =>
  <const TMIDIPortMutableProperty extends MIDIPortMutableProperty>(
    property: TMIDIPortMutableProperty,
  ) =>
  <E = never, R = never>(
    polymorphicPort: EMIDIPort.PolymorphicPort<E, R, TMIDIPortType>,
  ) =>
    Effect.isEffect(polymorphicPort)
      ? Effect.map(polymorphicPort, getValueInRawPortFieldUnsafe(property))
      : Effect.sync(() =>
          getValueInRawPortFieldUnsafe(property)(polymorphicPort),
        )

/**
 * @returns A state of the hardware connection between the OS and the device
 * ({@linkcode MIDIPortDeviceState}). Because it can change over time, it's
 * wrapped in effect. It's taken from the {@linkcode MIDIPort.state|state}
 * read-only property of the {@linkcode MIDIPort} interface ([MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/state)).
 */
export const getPortDeviceStateByPort = getMutableProperty()('state')

/**
 * @returns A state of the connection between the browser's tab and OS
 * abstraction of the device ({@linkcode MIDIPortConnectionState}). Because it
 * can change over time, it's wrapped in effect. It's taken from the
 * {@linkcode MIDIPort.connection|connection} read-only property of the
 * {@linkcode MIDIPort} interface ([MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/connection)).
 */
export const getPortConnectionStateByPort = getMutableProperty()('connection')

/**
 *
 */
export const getInputDeviceStateByPort = getMutableProperty<'input'>()('state')

/**
 *
 */
export const getInputConnectionStateByPort =
  getMutableProperty<'input'>()('connection')

/**
 *
 */
export const getOutputDeviceStateByPort =
  getMutableProperty<'output'>()('state')

/**
 *
 */
export const getOutputConnectionStateByPort =
  getMutableProperty<'output'>()('connection')
