'use client'

import { styled } from 'next-yak'

import * as Result from '@effect-atom/atom/Result'
import * as Hooks from '@effect-atom/atom-react/Hooks'

import { isStrengthSelectedAtom } from './atoms/buttonsAtom.ts'
import { allStrengths, type Strength } from './services/UIButtonService.ts'

const LAYOUT_HEIGHT = 2
const LAYOUT_WIDTH = 8

export default function Home() {
  return (
    <ButtonGrid
      role="grid"
      aria-rowcount={LAYOUT_HEIGHT}
      aria-colcount={LAYOUT_WIDTH}
    >
      <DisplayContentsWrapper role="row" aria-rowindex={2}>
        {Array.from(allStrengths, strength => (
          <StrengthButton strength={strength} key={strength} />
        ))}
      </DisplayContentsWrapper>
    </ButtonGrid>
  )
}

const StrengthButton = ({ strength }: { strength: Strength }) => {
  const isSelectedRes = Hooks.useAtomValue(isStrengthSelectedAtom(strength))

  if (!Result.isSuccess(isSelectedRes)) {
    console.log(
      `strength ${strength} is not success. isSelectedRes: `,
      isSelectedRes,
    )
    return 'loading...'
  }

  const { value: isSelected } = isSelectedRes

  return (
    <DebugButton data-strength={strength}>
      Strength: {strength}
      <br />
      Selected: {isSelected ? Yes : No}
    </DebugButton>
  )
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
  --viewport-vertical-size: 250px;
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
  -webkit-touch-callout: none;
  touch-action: none;
  user-select: none;
`

const DebugButton = styled.pre`
  border: 1px solid wheat;
  color: wheat;
  cursor: pointer;
  width: 100%;
  height: 100%;
`

const DisplayContentsWrapper = styled.div`
  display: contents;
`
