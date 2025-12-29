import type * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Record from 'effect/Record'
import * as EMIDIAccess from '../../EMIDIAccess.ts'
import * as EMIDIErrors from '../../EMIDIErrors.ts'
import type * as EMIDIPort from '../../EMIDIPort.ts'
import * as Get from './getMutablePortPropertyByPort.ts'

/**
 * @internal
 */
const getPortByIdGeneric2 =
  // biome-ignore lint/suspicious/noExplicitAny: I don't care
    <T extends Record.ReadonlyRecord<string & Brand.Brand<'MIDIPortId'>, any>>(
      getPortMap: <E = never, R = never>(
        polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
      ) => Effect.Effect<T, E, R>,
    ) =>
    <A, E2, R2, TE = never, TR = never>(
      polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<TE, TR>,
      transformPortEffect: (
        effect: Effect.Effect<
          T[Extract<keyof T, string & Brand.Brand<'MIDIPortId'>>],
          TE | EMIDIErrors.PortNotFoundError,
          TR
        >,
      ) => Effect.Effect<A, E2, R2>,
      portId: Extract<keyof T, EMIDIPort.BothId>,
    ) =>
      EFunction.pipe(
        getPortMap(polymorphicAccess),
        Effect.flatMap(
          EFunction.flow(
            Record.get(portId),
            Option.match({
              onNone: () => new EMIDIErrors.PortNotFoundError({ portId }),
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
  polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<TE, TR>,
  id: EMIDIPort.BothId,
) =>
  getPortByIdGeneric2(EMIDIAccess.getAllPortsRecord)(
    polymorphicAccess,
    EFunction.flow(
      Get.getPortDeviceStateByPort,
      Effect.catchTag('PortNotFound', () =>
        Effect.succeed('disconnected' as const),
      ),
    ),
    id,
  )

/**
 *
 *
 */
export const getPortConnectionStateByPortIdAndAccess = <TE = never, TR = never>(
  polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<TE, TR>,
  id: EMIDIPort.BothId,
) =>
  getPortByIdGeneric2(EMIDIAccess.getAllPortsRecord)(
    polymorphicAccess,
    Get.getPortConnectionStateByPort,
    id,
  )

// TODO: getInputConnectionStateByPortIdAndAccess
export const getInputConnectionStateByPortIdAndAccess = (
  ..._args: unknown[]
) => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}

// TODO: getInputDeviceStateByPortIdAndAccess
export const getInputDeviceStateByPortIdAndAccess = (..._args: unknown[]) => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}

// TODO: getOutputConnectionStateByPortIdAndAccess
export const getOutputConnectionStateByPortIdAndAccess = (
  ..._args: unknown[]
) => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}

// TODO: getOutputDeviceStateByPortIdAndAccess
export const getOutputDeviceStateByPortIdAndAccess = (..._args: unknown[]) => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}
