'use client'

import { Button as BaseButton } from '@base-ui/react/button'
import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import { styled } from 'next-yak'

import * as Result from '@effect-atom/atom/Result'
import * as Hooks from '@effect-atom/atom-react/Hooks'

import { accordsAtom } from './atoms/accordsAtom.ts'
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

const PatternButton = ({ pattern }: { pattern: AllPatternUnion }) => {
  return (
    <NeumorphicButton
      data-is-externally-active={false}
      data-button-id={pattern.index}
      role="gridcell"
      aria-colindex={pattern.index}
      type="button"
      aria-label={'Pattern №' + (pattern.index + 1)}
      children={pattern.label}
    />
  )
}

const AccordButton = ({ accord }: { accord: AllAccordUnion }) => {
  return (
    <NeumorphicButton
      data-is-externally-active={false}
      data-button-id={accord.index}
      role="gridcell"
      aria-colindex={accord.index}
      type="button"
      aria-label={accord.label}
      children={accord.label}
    />
  )
}

const ButtonGrid = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: #63796c;
  display: grid;

  --one-gap-size: 20px;
  --num-elements: 8;
  --view-port-size: 80vh;
  --num-gaps: calc(var(--num-elements) - 1);
  --size-taken-by-gaps: calc(var(--one-gap-size) * var(--num-gaps));
  --size-taken-by-elements: calc(var(--view-port-size) - var(--size-taken-by-gaps));
  --one-element-size: calc(var(--size-taken-by-elements) / var(--num-elements));

  gap: var(--one-gap-size);
  grid-template-rows: repeat(var(--num-elements), var(--one-element-size));
  grid-template-columns: repeat(var(--num-elements), var(--one-element-size));

  /* place-items: center; */
  place-content: center;
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
