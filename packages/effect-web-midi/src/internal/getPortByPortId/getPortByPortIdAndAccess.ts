/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'

import * as EMIDIAccess from '../EMIDIAccess.ts'
import * as EMIDIInput from '../EMIDIInput.ts'
import * as EMIDIOutput from '../EMIDIOutput.ts'
import type * as EMIDIPort from '../EMIDIPort.ts'
import * as MIDIErrors from '../MIDIErrors.ts'

/**
 *
 * @internal
 */
const getPortByIdAndRemap = <
  EInput,
  EOutput,
  RInput,
  ROutput,
  AInputType extends 'input' = never,
  AOutputType extends 'output' = never,
>(handlers: {
  onInputFound: (
    rawInput: MIDIInput,
  ) => Effect.Effect<EMIDIPort.EMIDIPort<AInputType>, EInput, RInput>
  onOutputFound: (
    rawOutput: MIDIOutput,
  ) => Effect.Effect<EMIDIPort.EMIDIPort<AOutputType>, EOutput, ROutput>
}): GetPortById<
  AInputType | AOutputType,
  AInputType | AOutputType,
  never,
  never,
  MIDIErrors.PortNotFoundError | EInput | EOutput,
  RInput | ROutput
> =>
  EFunction.dual(2, (polymorphicAccess, portId) =>
    Effect.flatMap(EMIDIAccess.simplify(polymorphicAccess), access => {
      const rawAccess = EMIDIAccess.assumeImpl(access)._access

      let rawPort: MIDIOutput | MIDIInput | undefined =
        rawAccess.inputs.get(portId)

      if (rawPort) return handlers.onInputFound(rawPort)

      rawPort = rawAccess.outputs.get(portId)

      if (rawPort) return handlers.onOutputFound(rawPort)

      return new MIDIErrors.PortNotFoundError({
        portId,
      }) as EMIDIAccess.AcquiredThing<
        EMIDIPort.EMIDIPort<AInputType | AOutputType>,
        never,
        never,
        never,
        never,
        MIDIErrors.PortNotFoundError | EInput | EOutput,
        RInput | ROutput
      >
    }),
  )

/**
 *
 * If you want to ensure the type of returned port match the type of ID, use
 * type-specific getters {@linkcode getInputByPortIdAndAccess} and
 * {@linkcode getOutputByPortIdAndAccess}, because in runtime, these branded
 * port IDs passed as function arguments, are just strings and cannot ensure
 * soundness
 */
export const getPortByPortIdAndAccess = getPortByIdAndRemap({
  onInputFound: EFunction.flow(EMIDIInput.make, Effect.succeed),
  onOutputFound: EFunction.flow(EMIDIOutput.make, Effect.succeed),
})

/**
 *
 *
 */
export const getInputByPortIdAndAccess = getPortByIdAndRemap({
  onInputFound: EFunction.flow(EMIDIInput.make, Effect.succeed),
  onOutputFound: rawOutput =>
    Effect.dieMessage(
      `Assertion failed: getInputById expected id=${rawOutput.id} to point at input, but it points at output instead`,
    ),
})

/**
 *
 *
 */
export const getOutputByPortIdAndAccess = getPortByIdAndRemap({
  onInputFound: rawInput =>
    Effect.dieMessage(
      `Assertion failed: getOutputById expected id=${rawInput.id} to point at output, but it points at input instead`,
    ),
  onOutputFound: EFunction.flow(EMIDIOutput.make, Effect.succeed),
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
    TAdditionalError | MIDIErrors.PortNotFoundError,
    TAdditionalRequirement
  > {}
