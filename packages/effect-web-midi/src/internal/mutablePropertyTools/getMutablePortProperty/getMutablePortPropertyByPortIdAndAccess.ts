import type * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as Record from 'effect/Record'

import * as EMIDIAccess from '../../EMIDIAccess.ts'
import type * as EMIDIInput from '../../EMIDIInput.ts'
import type * as EMIDIOutput from '../../EMIDIOutput.ts'
import type * as EMIDIPort from '../../EMIDIPort.ts'
import * as MIDIErrors from '../../MIDIErrors.ts'
import * as Get from './getMutablePortPropertyByPort.ts'

/**
 * @internal
 */
const getPortByIdGeneric2 =
  // biome-ignore lint/suspicious/noExplicitAny: I don't care
    <T extends Record.ReadonlyRecord<Brand.Branded<string, 'MIDIPortId'>, any>>(
      getPortMap: <E = never, R = never>(
        polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
      ) => Effect.Effect<T, E, R>,
    ) =>
    <A, E2, R2, E = never, R = never>(
      polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
      transformPortEffect: (
        effect: Effect.Effect<
          T[Extract<keyof T, Brand.Branded<string, 'MIDIPortId'>>],
          E | MIDIErrors.PortNotFoundError,
          R
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
              onNone: () => new MIDIErrors.PortNotFoundError({ portId }),
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
export const getPortDeviceStateByPortIdAndAccess = <E = never, R = never>(
  polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
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
export const getPortConnectionStateByPortIdAndAccess = <E = never, R = never>(
  polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
  id: EMIDIPort.BothId,
) =>
  getPortByIdGeneric2(EMIDIAccess.getAllPortsRecord)(
    polymorphicAccess,
    Get.getPortConnectionStateByPort,
    id,
  )

// TODO: getInputConnectionStateByPortIdAndAccess
export const getInputConnectionStateByPortIdAndAccess = <E = never, R = never>(
  polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
  id: EMIDIInput.Id,
) => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}

// TODO: getInputDeviceStateByPortIdAndAccess
export const getInputDeviceStateByPortIdAndAccess = <E = never, R = never>(
  polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
  id: EMIDIInput.Id,
) => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}

// TODO: getOutputConnectionStateByPortIdAndAccess
export const getOutputConnectionStateByPortIdAndAccess = <E = never, R = never>(
  polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
  id: EMIDIOutput.Id,
) => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}

// TODO: getOutputDeviceStateByPortIdAndAccess
export const getOutputDeviceStateByPortIdAndAccess = <E = never, R = never>(
  polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<E, R>,
  id: EMIDIOutput.Id,
) => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}
