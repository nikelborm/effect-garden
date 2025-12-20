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
  type PortTaken,
} from '../getPortByPortId/getPortByPortIdAndAccess.ts'
import { makeMIDIPortMethodCallerFactory } from './makeMIDIPortMethodCallerFactory.ts'
import type { MIDIBothPortId, MIDIPortId } from '../util.ts'
import * as Effect from 'effect/Effect'
import type { PortNotFoundError } from '../errors.ts'

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
    | (ReturnType<PortGetter> extends PortTaken<
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
        ? ReturnType<SecondHalf> extends PortTaken<
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
    | (ReturnType<PortGetter> extends PortTaken<
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
        ? ReturnType<SecondHalf> extends PortTaken<
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
  EPort,
  RPort,
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
    EPort | AccessE | PortNotFoundError,
    RPort | AccessR
  >
}

export interface ActOnPortAccessLast<
  THighLevelPortType extends MIDIPortType,
  EPort,
  RPort,
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
      EPort | EAccess | PortNotFoundError,
      RPort | RAccess
    >
  }
}
