'use client'
import { Button as BaseButton } from '@base-ui/react/button'
import { styled } from '@linaria/react'
import * as Either from 'effect/Either'
import { midiToNoteName } from './midiToNoteName.ts'

const ROWS = 8
const COLUMNS = 8

export function MidiPadSlide() {
  return (
    <ButtonGrid>
      {Array.from({ length: ROWS * COLUMNS }).map((_, i) => (
        <NeumorphicButton
          // biome-ignore lint/suspicious/noArrayIndexKey: explanation
          key={i}
          data-midi-note={i}
          // isExternallyActive={true}
          type="button"
        >
          {Either.getOrThrow(midiToNoteName(i))}
        </NeumorphicButton>
      ))}
    </ButtonGrid>
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
  align-content: center;
  justify-content: center;
`

const NeumorphicButton = styled(BaseButton)<{
  isExternallyActive?: boolean | undefined
}>`
  border: none;
  border-radius: 23px;
  color: wheat;
  cursor: pointer;
  width: 100%;
  height: 100%;
  border-radius: 23px;
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
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: -1;
    /* hidden by default */
    opacity: ${({ isExternallyActive }) => (isExternallyActive ? 1 : 0)};

    // pressed
    background: linear-gradient(145deg, #596d61, #6a8174);
    transition: opacity 300ms ease;
  }

  &:active::before {
    opacity: 1;
  }
`
