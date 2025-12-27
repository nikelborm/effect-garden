import type * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Record from 'effect/Record'
import * as EMIDIAccess from '../../EMIDIAccess.ts'
import * as Errors from '../../errors.ts'
import type * as Util from '../../util.ts'
import * as Get from './getMutablePortPropertyByPort.ts'

const getPortByIdGeneric2 =
  // biome-ignore lint/suspicious/noExplicitAny: I don't care
    <T extends Record.ReadonlyRecord<string & Brand.Brand<'MIDIPortId'>, any>>(
      getPortMap: <E = never, R = never>(
        polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
      ) => Effect.Effect<T, E, R>,
    ) =>
    <A, E2, R2, TE = never, TR = never>(
      polymorphicAccess: Util.PolymorphicEffect<
        EMIDIAccess.EMIDIAccessInstance,
        TE,
        TR
      >,
      transformPortEffect: (
        effect: Effect.Effect<
          T[Extract<keyof T, string & Brand.Brand<'MIDIPortId'>>],
          TE | Errors.PortNotFoundError,
          TR
        >,
      ) => Effect.Effect<A, E2, R2>,
      id: Extract<keyof T, Util.MIDIBothPortId>,
    ) =>
      EFunction.pipe(
        getPortMap(polymorphicAccess),
        Effect.flatMap(
          EFunction.flow(
            Record.get(id),
            Option.match({
              onNone: () => new Errors.PortNotFoundError({ portId: id }),
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
  polymorphicAccess: Util.PolymorphicEffect<
    EMIDIAccess.EMIDIAccessInstance,
    TE,
    TR
  >,
  portId: Util.MIDIBothPortId,
) =>
  getPortByIdGeneric2(EMIDIAccess.getAllPortsRecord)(
    polymorphicAccess,
    EFunction.flow(
      Get.getPortDeviceStateByPort,
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
  polymorphicAccess: Util.PolymorphicEffect<
    EMIDIAccess.EMIDIAccessInstance,
    TE,
    TR
  >,
  portId: Util.MIDIBothPortId,
) =>
  getPortByIdGeneric2(EMIDIAccess.getAllPortsRecord)(
    polymorphicAccess,
    Get.getPortConnectionStateByPort,
    portId,
  )

// TODO: getInputPortConnectionStateByPortIdAndAccess
export const getInputPortConnectionStateByPortIdAndAccess = () => {
  throw new Error('not implemented')
}

// TODO: getInputPortDeviceStateByPortIdAndAccess
export const getInputPortDeviceStateByPortIdAndAccess = () => {
  throw new Error('not implemented')
}

// TODO: getOutputPortConnectionStateByPortIdAndAccess
export const getOutputPortConnectionStateByPortIdAndAccess = () => {
  throw new Error('not implemented')
}

// TODO: getOutputPortDeviceStateByPortIdAndAccess
export const getOutputPortDeviceStateByPortIdAndAccess = () => {
  throw new Error('not implemented')
}
