import * as Data from 'effect/Data'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../brandsAndDatas/index.ts'
import {
  KeyboardPhysicalButtonIdData,
  type ValidKeyboardKey,
} from '../brandsAndDatas/StoreValues.ts'

export const makeKeyboardButtonPressStateStreamOfSomeKeys = (
  keysToFocusOn: Set<ValidKeyboardKey>,
  ref?: GlobalEventHandlers,
) => {
  const refWithFallback = ref ?? globalThis.window

  if (!refWithFallback) return Stream.empty

  return Stream.merge(
    Stream.fromEventListener<KeyboardEvent>(refWithFallback, 'keydown'),
    Stream.fromEventListener<KeyboardEvent>(refWithFallback, 'keyup'),
  ).pipe(
    Stream.filterMap(event =>
      keysToFocusOn.has(event.key as ValidKeyboardKey) &&
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
        ? Option.some(
            Data.tuple(
              new KeyboardPhysicalButtonIdData(event.key),
              event.type === 'keydown'
                ? ButtonState.Pressed
                : ButtonState.NotPressed,
            ),
          )
        : Option.none(),
    ),
    Stream.changes,
  )
}
