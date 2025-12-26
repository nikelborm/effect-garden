/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import { flow, dual, pipe } from 'effect/Function'
import * as EffectfulMIDIInputPort from '../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIAccess from '../EffectfulMIDIAccess.ts'
import * as EffectfulMIDIPort from '../EffectfulMIDIPort.ts'
import {
  getInputPortByPortIdAndAccess,
  getOutputPortByPortIdAndAccess,
  getPortByPortIdAndAccess,
  type GetPortById,
  type GetPortByIdAccessFirst,
  type GetPortByIdAccessLast,
  type GetPortByIdAccessLastSecondHalf,
  type AcquiredPort,
  type AcquiredThing,
  type GetThingByPortIdAccessLastSecondHalf,
  type GetThingByPortIdAccessLast,
  type GetThingByPortIdAccessFirst,
  type GetThingByPortId,
} from '../getPortByPortId/getPortByPortIdAndAccess.ts'
import { makeMIDIPortMethodCallerFactory } from './makeMIDIPortMethodCallerFactory.ts'
import {
  MIDIInputPortId,
  MIDIOutputPortId,
  type FallbackOnUnknownOrAny,
  type MIDIBothPortId,
  type MIDIPortId,
} from '../util.ts'
import * as Effect from 'effect/Effect'
import type { PortNotFoundError, UnavailablePortError } from '../errors.ts'
import * as Brand from 'effect/Brand'

export const actOnPort = <
  THighLevelPortType extends MIDIPortType,
  APort extends EffectfulMIDIPort.EffectfulMIDIPort<THighLevelPortType>,
  PortGetter extends GetPortById<
    MIDIPortId<THighLevelPortType>,
    APort,
    EPort,
    RPort
  >,
  EAccess extends
    | (ReturnType<PortGetter> extends AcquiredPort<
        APort,
        infer EAccess_,
        infer RAccess_,
        EPort,
        RPort
      >
        ? EAccess_
        : never)
    | (ReturnType<PortGetter> extends infer SecondHalf extends
        GetPortByIdAccessLastSecondHalf<APort, EPort, RPort>
        ? ReturnType<SecondHalf> extends AcquiredPort<
            APort,
            infer EAccess_,
            infer RAccess_,
            EPort,
            RPort
          >
          ? EAccess_
          : never
        : never),
  RAccess extends
    | (ReturnType<PortGetter> extends AcquiredPort<
        APort,
        infer EAccess_,
        infer RAccess_,
        EPort,
        RPort
      >
        ? RAccess_
        : never)
    | (ReturnType<PortGetter> extends infer SecondHalf extends
        GetPortByIdAccessLastSecondHalf<APort, EPort, RPort>
        ? ReturnType<SecondHalf> extends AcquiredPort<
            APort,
            infer EAccess_,
            infer RAccess_,
            EPort,
            RPort
          >
          ? RAccess_
          : never
        : never),
  EPort = never,
  RPort = never,
  // E2 = never,
  // R2 = never
>(
  portGetterFromAccessAndPortId: PortGetter,
  portTransformerSelfReturner: <TPortType extends THighLevelPortType>(
    polymorphicPort: EffectfulMIDIPort.PolymorphicPort<EPort, RPort, TPortType>,
  ) => Effect.Effect<
    EffectfulMIDIPort.EffectfulMIDIPort<TPortType>,
    EPort,
    RPort
  >,
) =>
  dual<
    ActOnPortAccessLast<THighLevelPortType, EPort, RPort>,
    ActOnPortAccessFirst<THighLevelPortType, EPort, RPort>
  >(
    2,
    flow(
      portGetterFromAccessAndPortId as GetPortByIdAccessFirst<
        MIDIPortId<THighLevelPortType>,
        APort,
        EPort,
        RPort
      >,
      e =>
        e as any as Effect.Effect<
          Effect.Effect.Success<typeof e>,
          Effect.Effect.Error<typeof e>,
          Effect.Effect.Context<typeof e>
        >,
      e => e,
      portTransformerSelfReturner,
    ),
  )

export interface ActOnPortAccessFirst<
  THighLevelPortType extends MIDIPortType,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  <AccessE = never, AccessR = never>(
    polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<
      AccessE,
      AccessR
    >,
    portId: MIDIPortId<THighLevelPortType>,
  ): Effect.Effect<
    EffectfulMIDIPort.EffectfulMIDIPort<THighLevelPortType>,
    TAdditionalError | AccessE | PortNotFoundError,
    TAdditionalRequirement | AccessR
  >
}

export interface ActOnPortAccessLast<
  THighLevelPortType extends MIDIPortType,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  (
    portId: MIDIPortId<THighLevelPortType>,
  ): {
    /**
     *
     *
     */
    <EAccess = never, RAccess = never>(
      polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<
        EAccess,
        RAccess
      >,
    ): Effect.Effect<
      EffectfulMIDIPort.EffectfulMIDIPort<THighLevelPortType>,
      TAdditionalError | EAccess | PortNotFoundError,
      TAdditionalRequirement | RAccess
    >
  }
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

export const actOnPort2 = <
  TPortTypeReturnedFromAccess extends TPortTypeSupportedInActing,
  TPortTypeSupportedInActing extends MIDIPortType,
  TPortGettingError = never,
  TPortGettingRequirement = never,
  // biome-ignore lint/suspicious/noExplicitAny: fuck it
  TActResult = any,
  TPortActingError = never,
  TPortActingRequirement = never,
>(
  portGetterFromAccessAndPortId: {
    /**
     *
     *
     */
    (
      accessPolymorphic: EffectfulMIDIAccess.PolymorphicAccessInstanceClean,
      portId: MIDIPortId<TPortTypeReturnedFromAccess>,
    ): Effect.Effect<
      EffectfulMIDIPort.EffectfulMIDIPort<TPortTypeReturnedFromAccess>,
      TPortGettingError,
      TPortGettingRequirement
    >
    /**
     *
     *
     */
    (
      portId: MIDIPortId<TPortTypeReturnedFromAccess>,
    ): {
      /**
       *
       *
       */
      (
        accessPolymorphic: EffectfulMIDIAccess.PolymorphicAccessInstanceClean,
      ): Effect.Effect<
        EffectfulMIDIPort.EffectfulMIDIPort<TPortTypeReturnedFromAccess>,
        TPortGettingError,
        TPortGettingRequirement
      >
    }
  },
  act: (
    portPolymorphic: EffectfulMIDIPort.PolymorphicPortClean<TPortTypeSupportedInActing>,
  ) => Effect.Effect<TActResult, TPortActingError, TPortActingRequirement>,
): ChainAccessWithPortId<
  TPortType,
  never,
  never,
  TPortGettingError | TPortActingError,
  TPortGettingRequirement | TPortActingRequirement
> => {
  return ((portId: any) => (accessPolymorphic: any) => {
    const eff = Effect.gen(function* () {
      const access = yield* EffectfulMIDIAccess.resolve(accessPolymorphic)

      const port = yield* portGetterFromAccessAndPortId(access, portId)

      const actEffect = act(
        port as unknown as EffectfulMIDIPort.EffectfulMIDIPort<TPortTypeSupportedInActing>,
      )

      yield* actEffect

      return access
    })
    return eff
  }) as any
}

const asd = actOnPort2(
  {} as any as GetPortById<'input', never, never, never, never>,
  // GetPortById<'input', never, never>, that comes from function like getInputPortByPortIdAndAccess
  // {
  //   <
  //     TAccessGettingError extends never = never,
  //     TAccessGettingRequirement extends never = never,
  //   >(
  //     polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<
  //       TAccessGettingError,
  //       TAccessGettingRequirement
  //     >,
  //     portId: MIDIPortId<'input'>,
  //   ): Effect.Effect<
  //     EffectfulMIDIPort.EffectfulMIDIPort<'input'>,
  //     TAccessGettingError | PortNotFoundError,
  //     TAccessGettingRequirement
  //   >
  // } & {
  //   /**
  //    *
  //    *
  //    */
  //   (
  //     portId: MIDIPortId<'input'>,
  //   ): {
  //     /**
  //      *
  //      *
  //      */
  //     <TAccessGettingError = never, TAccessGettingRequirement = never>(
  //       polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<
  //         TAccessGettingError,
  //         TAccessGettingRequirement
  //       >,
  //     ): Effect.Effect<
  //       EffectfulMIDIPort.EffectfulMIDIPort<'input'>,
  //       TAccessGettingError | PortNotFoundError,
  //       TAccessGettingRequirement
  //     >
  //   }
  // },
  (() => {}) as any as <E = never, R = never>(
    polymorphicPort: EffectfulMIDIPort.PolymorphicPort<never, never, 'input'>,
  ) => Effect.Effect<
    EffectfulMIDIPort.EffectfulMIDIPort<'input'>,
    UnavailablePortError | never,
    never
  >,
)

export interface ChainAccessWithPortId<
  TPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortId<
    EffectfulMIDIAccess.EffectfulMIDIAccessInstance,
    TPortType,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

export interface ChainAccessWithPortIdAccessFirst<
  TPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessFirst<
    EffectfulMIDIAccess.EffectfulMIDIAccessInstance,
    TPortType,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

export interface ChainAccessWithPortIdAccessLast<
  TPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessLast<
    EffectfulMIDIAccess.EffectfulMIDIAccessInstance,
    TPortType,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

export interface ChainAccessWithPortIdAccessLastSecondHalf<
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessLastSecondHalf<
    EffectfulMIDIAccess.EffectfulMIDIAccessInstance,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

export interface AcquiredAccess<
  TAccessGettingError,
  TAccessGettingRequirement,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends AcquiredThing<
    EffectfulMIDIAccess.EffectfulMIDIAccessInstance,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}
