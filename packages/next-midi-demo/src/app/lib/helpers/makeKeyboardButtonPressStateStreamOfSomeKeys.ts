import * as Data from 'effect/Data'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../branded/index.ts'
import {
  type ValidKeyboardKey,
  ValidKeyboardKeyData,
} from '../branded/StoreValues.ts'

export const makeKeyboardButtonPressStateStreamOfSomeKeys = (
  keysToFocusOn: Set<ValidKeyboardKey>,
  ref?: GlobalEventHandlers,
) => {
  const refWithFallback = ref ?? globalThis.window

  if (!refWithFallback) return Stream.empty

  return Stream.fromEventListener<KeyboardEvent>(refWithFallback, 'keydown', {
    bufferSize: 0,
  }).pipe(
    Stream.merge(
      Stream.fromEventListener<KeyboardEvent>(refWithFallback, 'keyup', {
        bufferSize: 0,
      }),
    ),
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
              new ValidKeyboardKeyData(event.key),
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
