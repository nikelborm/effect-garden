'use client'

import { Button as BaseButton } from '@base-ui/react/button'
import { styled } from '@linaria/react'

import { useAtomValue } from '@effect-atom/atom-react'
import * as Either from 'effect/Either'
import * as Option from 'effect/Option'

import type { RegisteredButtonID } from './branded/StoreValues.ts'
// import { flow } from 'effect/Function'
import { midiToNoteName } from './midiToNoteName.ts'
import {
  activeLayoutHeightAtom,
  activeLayoutWidthAtom,
  assertiveGetButtonByIdInActiveLayout,
  // keyboardNavigationAtom,
  registeredButtonIdsOfActiveLayoutAtom,
} from './state.ts'

// const keyboardNavigation = useAtomValue(keyboardNavigationAtom) ?? 0
// console.log('keyboardNavigation', keyboardNavigation)

export const MidiPadSlide = () =>
  Option.match(
    Option.all({
      width: useAtomValue(activeLayoutWidthAtom),
      height: useAtomValue(activeLayoutHeightAtom),
      ids: useAtomValue(registeredButtonIdsOfActiveLayoutAtom),
    }),
    {
      onNone: () => <span>No layout is selected</span>,
      onSome: ({ height, width, ids }) => (
        <ButtonGrid role="grid" aria-rowcount={height} aria-colcount={width}>
          {Array.from({ length: height }, (_, activeRowIndex) => (
            <DisplayContentsWrapper
              // biome-ignore lint/suspicious/noArrayIndexKey: There's no better option
              key={activeRowIndex}
              role="row"
              aria-rowindex={activeRowIndex}
            >
              {Array.from({ length: width }, (_, activeColumnIndex) => (
                <NoteButton
                  // biome-ignore lint/suspicious/noArrayIndexKey: There's no better option
                  key={activeColumnIndex}
                  buttonId={ids[activeRowIndex * width + activeColumnIndex]!}
                />
              ))}
            </DisplayContentsWrapper>
          ))}
        </ButtonGrid>
      ),
    },
  )

const NoteButton = ({ buttonId }: { buttonId: RegisteredButtonID }) =>
  Option.match(useAtomValue(assertiveGetButtonByIdInActiveLayout(buttonId)), {
    onNone: () => {
      throw new Error("There's no active layout")
    },
    onSome: cell => {
      const noteName = Either.getOrThrow(midiToNoteName(cell.assignedMIDINote))
      return (
        <NeumorphicButton
          data-midi-note={cell.assignedMIDINote}
          // data-is-externally-active={!!cell.activationReportedByDevice}
          role="gridcell"
          aria-colindex={cell.assignedMIDINote}
          type="button"
          aria-label={noteName + ' note button'}
          children={noteName}
        />
      )
    },
  })

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
  'data-midi-note': number
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
