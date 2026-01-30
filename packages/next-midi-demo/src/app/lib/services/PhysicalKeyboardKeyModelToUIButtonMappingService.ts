import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { ButtonState } from '../branded/index.ts'
import type { ValidKeyboardKey } from '../branded/StoreValues.ts'
import * as StoreValues from '../branded/StoreValues.ts'
import { PhysicalButtonModel } from '../helpers/PhysicalButtonModel.ts'
import { sortedMapModifyAt } from '../helpers/sortedMapModifyAt.ts'
import { type Accord, AccordRegistry } from './AccordRegistry.ts'
import { type Pattern, PatternRegistry } from './PatternRegistry.ts'

const keysHandlingPatterns = Array.from('12345678')
const keysHandlingAccords = Array.from('qwertyui')

const makeMapEntry = (assignedTo: Accord | Pattern, key: string) =>
  [
    StoreValues.ValidKeyboardKey(key),
    new PhysicalButtonModel(ButtonState.NotPressed, assignedTo),
  ] as const

export class PhysicalKeyboardKeyModelToUIButtonMappingService extends Effect.Service<PhysicalKeyboardKeyModelToUIButtonMappingService>()(
  'next-midi-demo/PhysicalKeyboardKeyModelToUIButtonMappingService',
  {
    accessors: true,
    dependencies: [PatternRegistry.Default, AccordRegistry.Default],
    scoped: Effect.gen(function* () {
      const allAccords = yield* AccordRegistry.allAccords
      const allPatterns = yield* PatternRegistry.allPatterns

      if (allPatterns.length !== keysHandlingPatterns.length)
        throw new Error(
          'Assertion failed: allPatterns.length !== keysHandlingPatterns.length',
        )

      if (allAccords.length !== keysHandlingAccords.length)
        throw new Error(
          'Assertion failed: allAccords.length !== keysHandlingAccords.length',
        )

      const modelToUIButtonMapRef =
        yield* SubscriptionRef.make<PhysicalKeyboardKeyModelToUIButtonMap>(
          SortedMap.make(StoreValues.ValidKeyboardKeyOrder)(
            ...EArray.zipWith(allPatterns, keysHandlingPatterns, makeMapEntry),
            ...EArray.zipWith(allAccords, keysHandlingAccords, makeMapEntry),
          ),
        )

      const currentMap = SubscriptionRef.get(modelToUIButtonMapRef)

      const getPhysicalKeyboardKeyModelState = (key: ValidKeyboardKey) =>
        Effect.map(
          currentMap,
          EFunction.flow(
            SortedMap.get(key),
            Option.getOrElse(
              () => new PhysicalButtonModel(ButtonState.NotPressed),
            ),
          ),
        )

      const setPhysicalKeyboardKeyModelState = (
        key: ValidKeyboardKey,
        pressState: ButtonState.Pressed | ButtonState.NotPressed,
      ) =>
        SubscriptionRef.update(
          modelToUIButtonMapRef,
          sortedMapModifyAt(key, keyModelOption =>
            Option.some(
              new PhysicalButtonModel(
                pressState,
                keyModelOption._tag === 'Some'
                  ? keyModelOption.value?.assignedTo
                  : undefined,
              ),
            ),
          ),
        )

      yield* EFunction.pipe(
        yield* currentMap,
        SortedMap.keys,
        makeKeyboardSliceMapStream,
        Stream.tap(({ key, keyboardKeyPressState }) =>
          setPhysicalKeyboardKeyModelState(key, keyboardKeyPressState),
        ),
        Stream.runDrain,
        Effect.forkScoped,
      )

      return {
        currentMap,
        mapChanges: modelToUIButtonMapRef.changes,
        getPhysicalKeyboardKeyModelState,
      }
    }),
  },
) {}

export const makeKeyboardSliceMapStream = <
  const SelectedKeys extends string,
  Ref extends GlobalEventHandlers,
>(
  keys: Iterable<SelectedKeys>,
  ref?: Ref,
) => {
  const refWithFallback = ref ?? globalThis.window

  const keySet = new Set(keys)

  return refWithFallback
    ? Stream.fromEventListener<KeyboardEvent>(refWithFallback, 'keydown', {
        bufferSize: 0,
      }).pipe(
        Stream.merge(
          Stream.fromEventListener<KeyboardEvent>(refWithFallback, 'keyup', {
            bufferSize: 0,
          }),
        ),
        Stream.filterMap(event =>
          keySet.has(event.key as SelectedKeys) &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          !event.metaKey &&
          !(
            event.target instanceof HTMLElement &&
            (event.target.tagName === 'INPUT' ||
              event.target.tagName === 'TEXTAREA' ||
              event.target.isContentEditable)
          )
            ? Option.some({
                key: StoreValues.ValidKeyboardKey(event.key),
                keyboardKeyPressState:
                  event.type === 'keydown'
                    ? ButtonState.Pressed
                    : ButtonState.NotPressed,
              })
            : Option.none(),
        ),
      )
    : Stream.empty
}

export interface PhysicalKeyboardKeyModelToUIButtonMap
  extends SortedMap.SortedMap<ValidKeyboardKey, PhysicalButtonModel> {}
