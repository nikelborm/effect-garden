import * as Data from 'effect/Data'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import * as ButtonState from '../domain/ButtonState.ts'
import {
  type KeyboardKey,
  KeyboardKeyPhysicalButtonData,
} from '../domain/KeyboardKey.ts'

export const makeKeyboardButtonPressStateStreamOfSomeKeys = (
  keysToFocusOn: Set<KeyboardKey>,
  ref?: GlobalEventHandlers,
): Stream.Stream<
  readonly [KeyboardKeyPhysicalButtonData, ButtonState.AllSimple]
> => {
  const refWithFallback = ref ?? globalThis.window

  if (!refWithFallback) return Stream.empty

  return Stream.merge(
    Stream.fromEventListener<KeyboardEvent>(refWithFallback, 'keydown'),
    Stream.fromEventListener<KeyboardEvent>(refWithFallback, 'keyup'),
  ).pipe(
    Stream.filterMap(event =>
      keysToFocusOn.has(event.key as KeyboardKey) &&
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
              KeyboardKeyPhysicalButtonData.makeUnsafe(event.key),
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
