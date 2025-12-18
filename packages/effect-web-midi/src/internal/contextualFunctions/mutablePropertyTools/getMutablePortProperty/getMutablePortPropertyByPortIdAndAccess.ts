import * as Effect from 'effect/Effect'
import { dual, flow, pipe } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Record from 'effect/Record'
import type {
  EffectfulMIDIAccessInstance,
  PolymorphicAccessInstance,
} from '../../../EffectfulMIDIAccess.ts'
import * as EffectfulMIDIPort from '../../../EffectfulMIDIPort.ts'
import { PortNotFoundError } from '../../../errors.ts'
import type { MIDIBothPortId, PolymorphicEffect } from '../../../util.ts'
import type {
  GetPortById,
  GetPortByIdAccessFirst,
  GetPortByIdAccessLast,
} from '../../getPortByPortId/getPortByPortIdAndAccess.ts'

const getPortByIdGeneric2 =
  <T extends Record.ReadonlyRecord<string, any>>(
    getPortMap: <E = never, R = never>(
      polymorphicAccess: PolymorphicAccessInstance<E, R>,
    ) => Effect.Effect<T, E, R>,
  ) =>
  <A, E2, R2, TE = never, TR = never>(
    polymorphicAccess: PolymorphicEffect<EffectfulMIDIAccessInstance, TE, TR>,
    transformPortEffect: (
      effect: Effect.Effect<
        T[Extract<keyof T, string>],
        TE | PortNotFoundError,
        TR
      >,
    ) => Effect.Effect<A, E2, R2>,
    id: Extract<keyof T, string>,
  ) =>
    pipe(
      getPortMap(polymorphicAccess),
      Effect.flatMap(
        flow(
          Record.get(id),
          Option.match({
            onNone: () => new PortNotFoundError({ attemptedToGetById: id }),
            onSome: e => Effect.succeed(e),
          }),
        ),
      ),
      transformPortEffect,
    )

// TODO: Check if software synth devices access is present. Having desired
// port absent in the record doesn't guarantee it's disconnected

const getPortDeviceStateGeneral =
  <TType extends MIDIBothPortId>() =>
  <
    OnInput extends EffectfulMIDIPort.EffectfulMIDIPort,
    OnOutput extends EffectfulMIDIPort.EffectfulMIDIPort,
  >(
    getPort: GetPortById<TType, OnInput, OnOutput>,
  ): GetPortById<TType, MIDIPortDeviceState, MIDIPortDeviceState> =>
    dual<
      GetPortByIdAccessLast<TType, MIDIPortDeviceState, MIDIPortDeviceState>,
      GetPortByIdAccessFirst<TType, MIDIPortDeviceState, MIDIPortDeviceState>
    >(2, (polymorphicAccess, portId) =>
      Effect.map(
        getPort(polymorphicAccess, portId),
        e => EffectfulMIDIPort.assumeImpl(e)._port.state,
      ),
    )

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
      EffectfulMIDIPort.getDeviceState,
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
    EffectfulMIDIPort.getConnectionState,
    portId,
  )
