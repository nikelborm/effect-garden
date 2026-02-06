import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import { ButtonState } from '../branded/index.ts'
import { ValidKeyboardKey } from '../branded/StoreValues.ts'

export const makeKeyboardButtonPressStateStreamOfSomeKeys = <
  Ref extends GlobalEventHandlers,
>(
  keys: Iterable<string>,
  ref?: Ref,
) => {
  const refWithFallback = ref ?? globalThis.window

  const keySet = new Set(keys)

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
      keySet.has(event.key as string) &&
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
        ? Option.some([
            ValidKeyboardKey(event.key),

            event.type === 'keydown'
              ? ButtonState.Pressed
              : ButtonState.NotPressed,
          ] as const)
        : Option.none(),
    ),
  )
}
