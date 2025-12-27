/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as EMIDIAccess from '../EMIDIAccess.ts'
import * as EMIDIInputPort from '../EMIDIInputPort.ts'
import * as EMIDIOutputPort from '../EMIDIOutputPort.ts'
import type * as EMIDIPort from '../EMIDIPort.ts'
import * as Errors from '../errors.ts'

/**
 *
 * @internal
 */
const getPortByIdAndRemap = <
  EInputPort,
  EOutputPort,
  RInputPort,
  ROutputPort,
  AInputPortType extends 'input' = never,
  AOutputPortType extends 'output' = never,
>(handlers: {
  onInputFound: (
    rawInputPort: MIDIInput,
  ) => Effect.Effect<
    EMIDIPort.EMIDIPort<AInputPortType>,
    EInputPort,
    RInputPort
  >
  onOutputFound: (
    rawOutputPort: MIDIOutput,
  ) => Effect.Effect<
    EMIDIPort.EMIDIPort<AOutputPortType>,
    EOutputPort,
    ROutputPort
  >
}): GetPortById<
  AInputPortType | AOutputPortType,
  AInputPortType | AOutputPortType,
  never,
  never,
  Errors.PortNotFoundError | EInputPort | EOutputPort,
  RInputPort | ROutputPort
> =>
  EFunction.dual(2, (polymorphicAccess, portId) =>
    Effect.flatMap(EMIDIAccess.resolve(polymorphicAccess), e => {
      const rawAccess = EMIDIAccess.assumeImpl(e)._access

      let rawPort: MIDIOutput | MIDIInput | undefined =
        rawAccess.inputs.get(portId)

      if (rawPort) return handlers.onInputFound(rawPort)

      rawPort = rawAccess.outputs.get(portId)

      if (rawPort) return handlers.onOutputFound(rawPort)

      return new Errors.PortNotFoundError({
        portId,
      }) as EMIDIAccess.AcquiredThing<
        EMIDIPort.EMIDIPort<AInputPortType | AOutputPortType>,
        never,
        never,
        never,
        never,
        Errors.PortNotFoundError | EInputPort | EOutputPort,
        RInputPort | ROutputPort
      >
    }),
  )

/**
 *
 * If you want to ensure the type of returned port match the type of id, use
 * type-specific getters {@linkcode getInputPortByPortIdAndAccess} and
 * {@linkcode getOutputPortByPortIdAndAccess}, because in runtime, these branded
 * port IDs passed as function arguments, are just strings and cannot ensure
 * soundness
 */
export const getPortByPortIdAndAccess = getPortByIdAndRemap({
  onInputFound: EFunction.flow(EMIDIInputPort.make, Effect.succeed),
  onOutputFound: EFunction.flow(EMIDIOutputPort.make, Effect.succeed),
})

/**
 *
 *
 */
export const getInputPortByPortIdAndAccess = getPortByIdAndRemap({
  onInputFound: EFunction.flow(EMIDIInputPort.make, Effect.succeed),
  onOutputFound: rawOutputPort =>
    Effect.dieMessage(
      `Assertion failed: getInputPortById found output port with the id=${rawOutputPort.id}`,
    ),
})

/**
 *
 *
 */
export const getOutputPortByPortIdAndAccess = getPortByIdAndRemap({
  onInputFound: rawInputPort =>
    Effect.dieMessage(
      `Assertion failed: getOutputPortById found output port with the id=${rawInputPort.id}`,
    ),
  onOutputFound: EFunction.flow(EMIDIOutputPort.make, Effect.succeed),
})

export interface GetPortById<
  TReturnedPortType extends TTypeOfPortId,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends EMIDIAccess.GetThingByPortId<
    EMIDIPort.EMIDIPort<TReturnedPortType>,
    TTypeOfPortId,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError | Errors.PortNotFoundError,
    TAdditionalRequirement
  > {}
