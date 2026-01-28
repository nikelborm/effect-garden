import * as EArray from 'effect/Array'
import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as SortedMap from 'effect/SortedMap'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { ButtonState } from '../branded/index.ts'
import type {
  RegisteredButtonID,
  ValidKeyboardKey,
} from '../branded/StoreValues.ts'
import * as StoreValues from '../branded/StoreValues.ts'
import { UIButtonService } from './UIButtonService.ts'

const keyboardLayout = {
  keysHandlingPatterns: Array.from('12345678'),
  keysHandlingAccords: Array.from('qwertyui'),
}

export class PhysicalKeyboardKeyToUIButtonMappingService extends Effect.Service<PhysicalKeyboardKeyToUIButtonMappingService>()(
  'next-midi-demo/PhysicalKeyboardKeyToUIButtonMappingService',
  {
    accessors: true,
    dependencies: [UIButtonService.Default],
    effect: Effect.gen(function* () {
      const buttonService = yield* UIButtonService
      const patternButtonIds = yield* buttonService.patternButtonIds
      const accordButtonIds = yield* buttonService.accordButtonIds

      if (
        patternButtonIds.length !== keyboardLayout.keysHandlingPatterns.length
      )
        throw new Error(
          'Assertion failed: patternButtonIds.length !== keyboardLayout.keysHandlingPatterns.length',
        )

      if (accordButtonIds.length !== keyboardLayout.keysHandlingAccords.length)
        throw new Error(
          'Assertion failed: accordButtonIds.length !== keyboardLayout.keysHandlingAccords.length',
        )

      const makeMapEntry = (
        registeredButtonId: RegisteredButtonID,
        key: string,
      ) =>
        [
          StoreValues.ValidKeyboardKey(key),
          new AssignedPhysicalKeyboardKey(
            ButtonState.NotPressed,
            registeredButtonId,
          ),
        ] as const

      const physicalToVirtualKeyMapRef =
        yield* SubscriptionRef.make<PhysicalKeyboardKeyToUIButtonMap>(
          SortedMap.make(StoreValues.ValidKeyboardKeyOrder)(
            ...EArray.zipWith(
              patternButtonIds,
              keyboardLayout.keysHandlingPatterns,
              makeMapEntry,
            ),
            ...EArray.zipWith(
              accordButtonIds,
              keyboardLayout.keysHandlingAccords,
              makeMapEntry,
            ),
          ),
        )

      const currentMap = SubscriptionRef.get(physicalToVirtualKeyMapRef)

      const getPhysicalKeyboardKeyStateFromMap = (key: ValidKeyboardKey) =>
        EFunction.flow(
          SortedMap.get(key)<AssignedPhysicalKeyboardKey>,
          Option.getOrElse(
            () => new AssignedPhysicalKeyboardKey(ButtonState.NotPressed),
          ),
        )

      const getPhysicalKeyboardKeyState = (key: ValidKeyboardKey) =>
        Effect.map(currentMap, getPhysicalKeyboardKeyStateFromMap(key))

      const setPhysicalKeyboardKeyState = (
        key: ValidKeyboardKey,
        keyboardKeyPressState: ButtonState.Pressed | ButtonState.NotPressed,
      ) =>
        SubscriptionRef.update(physicalToVirtualKeyMapRef, prevMap =>
          SortedMap.set(
            prevMap,
            key,
            AssignedPhysicalKeyboardKey.setState(
              getPhysicalKeyboardKeyStateFromMap(key)(prevMap),
              keyboardKeyPressState,
            ),
          ),
        )

      return {
        currentMap,
        mapChanges: physicalToVirtualKeyMapRef.changes,
        setPhysicalKeyboardKeyState,
        getPhysicalKeyboardKeyState,
      }
    }),
  },
) {}

export interface PhysicalKeyboardKeyToUIButtonMap
  extends SortedMap.SortedMap<ValidKeyboardKey, AssignedPhysicalKeyboardKey> {}

export class AssignedPhysicalKeyboardKey extends Data.Class<{
  assignedToUIButtonId?: RegisteredButtonID
  keyboardKeyPressState: ButtonState.NotPressed | ButtonState.Pressed
}> {
  constructor(
    keyboardKeyPressState: ButtonState.NotPressed | ButtonState.Pressed,
    assignedToUIButtonId?: RegisteredButtonID,
  ) {
    super({
      keyboardKeyPressState,
      ...(assignedToUIButtonId && { assignedToUIButtonId }),
    })
  }

  static setState = (
    info: AssignedPhysicalKeyboardKey,
    state: ButtonState.NotPressed | ButtonState.Pressed,
  ) => new AssignedPhysicalKeyboardKey(state, info.assignedToUIButtonId)
}
