/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import { flow, dual, pipe } from 'effect/Function'
import * as EMIDIInputPort from '../EMIDIInputPort.ts'
import * as EMIDIOutputPort from '../EMIDIOutputPort.ts'
import * as EMIDIAccess from '../EMIDIAccess.ts'
import * as EMIDIPort from '../EMIDIPort.ts'
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
import { openInputPortConnectionByPort } from './openPortConnection/openPortConnectionByPort.ts'

export const actOnPort = <
  THighLevelPortType extends MIDIPortType,
  APort extends EMIDIPort.EMIDIPort<THighLevelPortType>,
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
    polymorphicPort: EMIDIPort.PolymorphicPort<EPort, RPort, TPortType>,
  ) => Effect.Effect<EMIDIPort.EMIDIPort<TPortType>, EPort, RPort>,
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
    polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<AccessE, AccessR>,
    portId: MIDIPortId<THighLevelPortType>,
  ): Effect.Effect<
    EMIDIPort.EMIDIPort<THighLevelPortType>,
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
      polymorphicAccess: EMIDIAccess.PolymorphicAccessInstance<
        EAccess,
        RAccess
      >,
    ): Effect.Effect<
      EMIDIPort.EMIDIPort<THighLevelPortType>,
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
      polymorphicAccess: EMIDIAccess.PolymorphicAccessInstanceClean,
      portId: MIDIPortId<TPortTypeReturnedFromAccess>,
    ): Effect.Effect<
      EMIDIPort.EMIDIPort<TPortTypeReturnedFromAccess>,
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
        polymorphicAccess: EMIDIAccess.PolymorphicAccessInstanceClean,
      ): Effect.Effect<
        EMIDIPort.EMIDIPort<TPortTypeReturnedFromAccess>,
        TPortGettingError,
        TPortGettingRequirement
      >
    }
  },
  act: (
    polymorphicPort: EMIDIPort.PolymorphicPortClean<TPortTypeSupportedInActing>,
  ) => Effect.Effect<TActResult, TPortActingError, TPortActingRequirement>,
): ChainAccessWithPortId<
  TPortTypeReturnedFromAccess,
  never,
  never,
  TPortGettingError | TPortActingError,
  TPortGettingRequirement | TPortActingRequirement
> => {
  return ((portId: any) => (polymorphicAccess: any) => {
    const eff = Effect.gen(function* () {
      const access = yield* EMIDIAccess.resolve(polymorphicAccess)

      const port = yield* portGetterFromAccessAndPortId(access, portId)

      const actEffect = act(
        port as unknown as EMIDIPort.EMIDIPort<TPortTypeSupportedInActing>,
      )

      yield* actEffect

      return access
    })
    return eff
  }) as any
}

type sawwd = GetPortById<
  'input',
  'input' | 'output',
  never,
  never,
  never,
  never
>
// TReturnedPortType = "input",
// TTypeOfPortId = "input" | 'output',
// TAccessGettingFallbackError = never,
// TAccessGettingFallbackRequirement = never,
// TAdditionalError = never,
// TAdditionalRequirement = never

const asd = actOnPort2(
  getInputPortByPortIdAndAccess,
  openInputPortConnectionByPort,

  // (() => {}) as any as <E = never, R = never>(
  //   polymorphicPort: EMIDIPort.PolymorphicPort<never, never, 'input'>,
  // ) => Effect.Effect<
  //   EMIDIPort.EMIDIPort<'input'>,
  //   UnavailablePortError | never,
  //   never
  // >,
)

export interface ChainAccessWithPortId<
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortId<
    EMIDIAccess.EMIDIAccessInstance,
    TTypeOfPortId,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

export interface ChainAccessWithPortIdAccessFirst<
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessFirst<
    EMIDIAccess.EMIDIAccessInstance,
    TTypeOfPortId,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

export interface ChainAccessWithPortIdAccessLast<
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessLast<
    EMIDIAccess.EMIDIAccessInstance,
    TTypeOfPortId,
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
    EMIDIAccess.EMIDIAccessInstance,
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
    EMIDIAccess.EMIDIAccessInstance,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}
