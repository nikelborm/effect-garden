'use client'

import { Button as BaseButton } from '@base-ui/react/button'
import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import { styled } from 'next-yak'

import * as Result from '@effect-atom/atom/Result'
import * as Hooks from '@effect-atom/atom-react/Hooks'

import { accordsAtom } from './atoms/accordsAtom.ts'
import {
  isAccordButtonPressableAtom,
  isAccordPressedAtom,
  isAccordSelectedAtom,
  isPatternButtonPressableAtom,
  isPatternPressedAtom,
  isPatternSelectedAtom,
} from './atoms/buttonsAtom.ts'
import { patternsAtom } from './atoms/patternsAtom.ts'
import { strengthsAtom } from './atoms/strengthAtom.ts'
import { LAYOUT_HEIGHT, LAYOUT_WIDTH } from './constants.ts'
import type { AllAccordUnion } from './services/AccordRegistry.ts'
import type { AllPatternUnion } from './services/PatternRegistry.ts'

export const MidiPadSlide = ({
  selectedInputPortId,
}: {
  selectedInputPortId: EMIDIInput.Id | null
}) => {
  const res = Result.all({
    accords: Hooks.useAtomValue(accordsAtom),
    patterns: Hooks.useAtomValue(patternsAtom),
    strengths: Hooks.useAtomValue(strengthsAtom),
  })

  if (!Result.isSuccess(res)) return 'wtf'
  const { accords, patterns, strengths } = res.value
  return (
    <ButtonGrid
      role="grid"
      aria-rowcount={LAYOUT_HEIGHT}
      aria-colcount={LAYOUT_WIDTH}
    >
      <DisplayContentsWrapper role="row" aria-rowindex={0}>
        {Array.from(patterns, pattern => (
          <PatternButton pattern={pattern} key={pattern.index} />
        ))}
      </DisplayContentsWrapper>
      <DisplayContentsWrapper role="row" aria-rowindex={1}>
        {Array.from(accords, accord => (
          <AccordButton accord={accord} key={accord.index} />
        ))}
      </DisplayContentsWrapper>
    </ButtonGrid>
  )
}
// isAccordButtonPressableAtom
// isPatternButtonPressableAtom
// isStrengthButtonPressableAtom
const PatternButton = ({ pattern }: { pattern: AllPatternUnion }) => {
  const res = Result.all({
    isPressable: Hooks.useAtomValue(isPatternButtonPressableAtom(pattern)),
    isActive: Hooks.useAtomValue(isPatternSelectedAtom(pattern)),
    isPressed: Hooks.useAtomValue(isPatternPressedAtom(pattern)),
  })

  if (Result.isFailure(res)) {
    console.log(res)
    return 'wtf. failure of pattern button'
  }

  const { isPressable, isActive, isPressed } = res.value ?? {}

  return (
    <DebugButton>
      {pattern.label}
      <br />
      Pressable: {isPressable ? Yes : No}
      <br />
      Active: {isActive ? Yes : No}
      <br />
      Pressed: {isPressed ? Yes : No}
    </DebugButton>
  )
  // return (
  //   <NeumorphicButton
  //     data-is-externally-active={false}
  //     data-button-id={pattern.index}
  //     role="gridcell"
  //     aria-colindex={pattern.index}
  //     type="button"
  //     aria-label={'Pattern №' + (pattern.index + 1)}
  //     children={pattern.label}
  //   />
  // )
}

const AccordButton = ({ accord }: { accord: AllAccordUnion }) => {
  const { value: isPressable } = Hooks.useAtomValue(
    isAccordButtonPressableAtom(accord),
  )
  const { value: isActive } = Hooks.useAtomValue(isAccordSelectedAtom(accord))
  const { value: isPressed } = Hooks.useAtomValue(isAccordPressedAtom(accord))
  return (
    <DebugButton>
      {accord.label}
      <br />
      Pressable: {isPressable ? Yes : No}
      <br />
      Active: {isActive ? Yes : No}
      <br />
      Pressed: {isPressed ? Yes : No}
    </DebugButton>
  )
  // return (
  //   <NeumorphicButton
  //     data-is-externally-active={false}
  //     data-button-id={accord.index}
  //     role="gridcell"
  //     aria-colindex={accord.index}
  //     type="button"
  //     aria-label={accord.label}
  //     children={accord.label}
  //   />
  // )
}

const Yes = <span style={{ color: 'yellow' }}>Yes</span>
const No = <span style={{ color: 'darkred' }}>No</span>

const ButtonGrid = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: #63796c;
  display: grid;

  --one-gap-size: 20px;
  --num-elements: 8;
  --num-rows: 2;
  --num-column: 8;
  --viewport-vertical-size: 200px;
  --viewport-horizontal-size: 1600px;
  --num-row-gaps: calc(var(--num-rows) - 1);
  --num-column-gaps: calc(var(--num-column) - 1);
  --size-taken-by-row-gaps: calc(var(--one-gap-size) * var(--num-row-gaps));
  --size-taken-by-column-gaps: calc(var(--one-gap-size) * var(--num-column-gaps));
  --size-taken-by-row-elements: calc(var(--viewport-vertical-size) - var(--size-taken-by-row-gaps));
  --size-taken-by-column-elements: calc(var(--viewport-horizontal-size) - var(--size-taken-by-column-gaps));
  --one-element-height: calc(var(--size-taken-by-row-elements) / var(--num-rows));
  --one-element-width: calc(var(--size-taken-by-column-elements) / var(--num-column));

  gap: var(--one-gap-size);
  grid-template-rows: repeat(var(--num-rows), var(--one-element-height));
  grid-template-columns: repeat(var(--num-column), var(--one-element-width));

  /* place-items: center; */
  place-content: center;
`

const DebugButton = styled.pre`
  border: 1px solid wheat;
  color: wheat;
  cursor: pointer;
  width: 100%;
  height: 100%;
`

const NeumorphicButton = styled(BaseButton)<{
  $isExternallyActive?: boolean | undefined
  'data-button-id': number
}>`
  border: none;
  border-radius: 23px;
  color: wheat;
  cursor: pointer;
  width: 100%;
  height: 100%;
  box-shadow:  5px  5px 13px #53665b,
              -5px -5px 13px #738c7d;
  align-content: center;
  text-align: center;
  position: relative;
  z-index: 1;
  overflow: hidden;

  /* released */
  background-image: linear-gradient(145deg, #6a8174, #596d61);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;

    /* hidden by default */
    opacity: ${({ $isExternallyActive }) => ($isExternallyActive ? 1 : 0)};

    /* pressed */
    background: linear-gradient(145deg, #596d61, #6a8174);
    transition: opacity 300ms ease;
  }

  &:active::before {
    opacity: 1;
  }
`

const DisplayContentsWrapper = styled.div`
  display: contents;
`
