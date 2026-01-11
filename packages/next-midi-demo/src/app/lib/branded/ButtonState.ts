import type * as Brand from 'effect/Brand'

export type NotPressed = Brand.Branded<0, 'Not pressed'>
export const NotPressed = 0 as NotPressed

export type Pressed = Brand.Branded<1, 'Pressed'>
export const Pressed = 1 as Pressed

export type PressedContinuously = Brand.Branded<2, 'Pressed continuously'>
export const PressedContinuously = 2 as PressedContinuously

export const isNotPressed = (state: number): state is NotPressed =>
  state === NotPressed

export const isPressed = (state: number): state is Pressed => state === Pressed

export const isPressedContinuously = (
  state: number,
): state is PressedContinuously => state === PressedContinuously
