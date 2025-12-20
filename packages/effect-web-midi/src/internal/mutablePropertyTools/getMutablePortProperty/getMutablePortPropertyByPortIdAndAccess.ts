import * as Effect from 'effect/Effect'
import { flow, pipe } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Record from 'effect/Record'
import {
  type EffectfulMIDIAccessInstance,
  getAllPortsRecord,
  type PolymorphicAccessInstance,
} from '../../EffectfulMIDIAccess.ts'
import { PortNotFoundError } from '../../errors.ts'
import type { MIDIBothPortId, PolymorphicEffect } from '../../util.ts'
import {
  getPortConnectionStateByPort,
  getPortDeviceStateByPort,
} from './getMutablePortPropertyByPort.ts'
import * as Brand from 'effect/Brand'

const getPortByIdGeneric2 =
  <T extends Record.ReadonlyRecord<string & Brand.Brand<'MIDIPortId'>, any>>(
    getPortMap: <E = never, R = never>(
      polymorphicAccess: PolymorphicAccessInstance<E, R>,
    ) => Effect.Effect<T, E, R>,
  ) =>
  <A, E2, R2, TE = never, TR = never>(
    polymorphicAccess: PolymorphicEffect<EffectfulMIDIAccessInstance, TE, TR>,
    transformPortEffect: (
      effect: Effect.Effect<
        T[Extract<keyof T, string & Brand.Brand<'MIDIPortId'>>],
        TE | PortNotFoundError,
        TR
      >,
    ) => Effect.Effect<A, E2, R2>,
    id: Extract<keyof T, MIDIBothPortId>,
  ) =>
    pipe(
      getPortMap(polymorphicAccess),
      Effect.flatMap(
        flow(
          Record.get(id),
          Option.match({
            onNone: () => new PortNotFoundError({ portId: id }),
            onSome: e => Effect.succeed(e),
          }),
        ),
      ),
      transformPortEffect,
    )

// TODO: Check if software synth devices access is present. Having desired
// port absent in the record doesn't guarantee it's disconnected

/**
 *
 *
 */
export const getPortDeviceStateByPortIdAndAccess = <TE = never, TR = never>(
  polymorphicAccess: PolymorphicEffect<EffectfulMIDIAccessInstance, TE, TR>,
  portId: MIDIBothPortId,
) =>
  getPortByIdGeneric2(getAllPortsRecord)(
    polymorphicAccess,
    flow(
      getPortDeviceStateByPort,
      Effect.catchTag('PortNotFound', () =>
        Effect.succeed('disconnected' as const),
      ),
    ),
    portId,
  )

/**
 *
 *
 */
export const getPortConnectionStateByPortIdAndAccess = <TE = never, TR = never>(
  polymorphicAccess: PolymorphicEffect<EffectfulMIDIAccessInstance, TE, TR>,
  portId: MIDIBothPortId,
) =>
  getPortByIdGeneric2(getAllPortsRecord)(
    polymorphicAccess,
    getPortConnectionStateByPort,
    portId,
  )

// TODO: other variants for inputs and outputs
