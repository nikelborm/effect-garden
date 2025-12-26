/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import { dual, flow } from 'effect/Function'
import * as EffectfulMIDIAccess from '../EffectfulMIDIAccess.ts'
import * as EffectfulMIDIInputPort from '../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../EffectfulMIDIOutputPort.ts'
import type * as EffectfulMIDIPort from '../EffectfulMIDIPort.ts'
import { PortNotFoundError } from '../errors.ts'
import type { FallbackOnUnknownOrAny, MIDIPortId } from '../util.ts'

/**
 *
 * @internal
 */
export const getPortByIdAndRemap = <
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
    EffectfulMIDIPort.EffectfulMIDIPort<AInputPortType>,
    EInputPort,
    RInputPort
  >
  onOutputFound: (
    rawOutputPort: MIDIOutput,
  ) => Effect.Effect<
    EffectfulMIDIPort.EffectfulMIDIPort<AOutputPortType>,
    EOutputPort,
    ROutputPort
  >
}): GetPortById<
  AInputPortType | AOutputPortType,
  AInputPortType | AOutputPortType,
  never,
  never,
  EInputPort | EOutputPort,
  RInputPort | ROutputPort
> =>
  dual(2, (polymorphicAccess, portId) =>
    Effect.flatMap(EffectfulMIDIAccess.resolve(polymorphicAccess), e => {
      const rawAccess = EffectfulMIDIAccess.assumeImpl(e)._access

      let rawPort: MIDIOutput | MIDIInput | undefined =
        rawAccess.inputs.get(portId)

      if (rawPort) return handlers.onInputFound(rawPort)

      rawPort = rawAccess.outputs.get(portId)

      if (rawPort) return handlers.onOutputFound(rawPort)

      return new PortNotFoundError({ portId }) as AcquiredPort<
        AInputPortType | AOutputPortType,
        never,
        never,
        never,
        never,
        EInputPort | EOutputPort,
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
  onInputFound: flow(EffectfulMIDIInputPort.make, Effect.succeed),
  onOutputFound: flow(EffectfulMIDIOutputPort.make, Effect.succeed),
})

/**
 *
 *
 */
export const getInputPortByPortIdAndAccess = getPortByIdAndRemap({
  onInputFound: flow(EffectfulMIDIInputPort.make, Effect.succeed),
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
  onOutputFound: flow(EffectfulMIDIOutputPort.make, Effect.succeed),
})

export interface GetPortById<
  TReturnedPortType extends TTypeOfPortId,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortId<
    EffectfulMIDIPort.EffectfulMIDIPort<TReturnedPortType>,
    TTypeOfPortId,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError | PortNotFoundError,
    TAdditionalRequirement
  > {}

export interface GetPortByIdAccessFirst<
  TReturnedPortType extends TTypeOfPortId,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessFirst<
    EffectfulMIDIPort.EffectfulMIDIPort<TReturnedPortType>,
    TTypeOfPortId,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError | PortNotFoundError,
    TAdditionalRequirement
  > {}

export interface GetPortByIdAccessLast<
  TReturnedPortType extends TTypeOfPortId,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessLast<
    EffectfulMIDIPort.EffectfulMIDIPort<TReturnedPortType>,
    TTypeOfPortId,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError | PortNotFoundError,
    TAdditionalRequirement
  > {}

export interface GetPortByIdAccessLastSecondHalf<
  TReturnedPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessLastSecondHalf<
    EffectfulMIDIPort.EffectfulMIDIPort<TReturnedPortType>,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError | PortNotFoundError,
    TAdditionalRequirement
  > {}

export interface AcquiredPort<
  TReturnedPortType extends MIDIPortType,
  TAccessGettingError,
  TAccessGettingRequirement,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends AcquiredThing<
    EffectfulMIDIPort.EffectfulMIDIPort<TReturnedPortType>,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError | PortNotFoundError,
    TAdditionalRequirement
  > {}

// =======================================
// =======================================
// =======================================

export interface GetThingByPortId<
  TSuccess,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessFirst<
      TSuccess,
      TTypeOfPortId,
      TAccessGettingFallbackError,
      TAccessGettingFallbackRequirement,
      TAdditionalError,
      TAdditionalRequirement
    >,
    GetThingByPortIdAccessLast<
      TSuccess,
      TTypeOfPortId,
      TAccessGettingFallbackError,
      TAccessGettingFallbackRequirement,
      TAdditionalError,
      TAdditionalRequirement
    > {}

export interface GetThingByPortIdAccessFirst<
  TSuccess,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  <TAccessGettingError = never, TAccessGettingRequirement = never>(
    polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<
      TAccessGettingError,
      TAccessGettingRequirement
    >,
    portId: MIDIPortId<TTypeOfPortId>,
  ): AcquiredThing<
    TSuccess,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface GetThingByPortIdAccessLast<
  TSuccess,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  (
    portId: MIDIPortId<TTypeOfPortId>,
  ): GetThingByPortIdAccessLastSecondHalf<
    TSuccess,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface GetThingByPortIdAccessLastSecondHalf<
  TSuccess,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  <TAccessGettingError = never, TAccessGettingRequirement = never>(
    polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<
      TAccessGettingError,
      TAccessGettingRequirement
    >,
  ): AcquiredThing<
    TSuccess,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface AcquiredThing<
  TSuccess,
  TAccessGettingError,
  TAccessGettingRequirement,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends Effect.Effect<
    TSuccess,
    | FallbackOnUnknownOrAny<TAccessGettingError, TAccessGettingFallbackError>
    | TAdditionalError,
    | FallbackOnUnknownOrAny<
        TAccessGettingRequirement,
        TAccessGettingFallbackRequirement
      >
    | TAdditionalRequirement
  > {}
