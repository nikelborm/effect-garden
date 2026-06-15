'use client'

import { Button as BaseButton } from '@base-ui/react/button'
import type * as EMIDIInput from 'effect-web-midi/EMIDIInput'
import { styled } from 'next-yak'
import { useEffect, useState } from 'react'

import * as Result from '@effect-atom/atom/Result'
import * as Hooks from '@effect-atom/atom-react/Hooks'

import { accordsAtom } from '../atoms/accordsAtom.ts'
import {
  accordButtonDownloadPercentAtom,
  // isAccordButtonCurrentlyPlayingAtom,
  // isAccordButtonPressableAtom,
  isAccordPressedAtom,
  isAccordSelectedAtom,
  // isPatternButtonCurrentlyPlayingAtom,
  // isPatternButtonPressableAtom,
  isPatternPressedAtom,
  isPatternSelectedAtom,
  // isStrengthButtonCurrentlyPlayingAtom,
  // isStrengthButtonPressableAtom,
  isStrengthPressedAtom,
  isStrengthSelectedAtom,
  patternButtonDownloadPercentAtom,
  strengthButtonDownloadPercentAtom,
  testAtom,
} from '../atoms/buttonsAtom.ts'
import { patternsAtom } from '../atoms/patternsAtom.ts'
import { strengthsAtom } from '../atoms/strengthAtom.ts'
import type { Accord } from '../brandsAndDatas/Accord.ts'
import type { Pattern } from '../brandsAndDatas/Pattern.ts'
import type { Strength } from '../brandsAndDatas/Strength.ts'
import { LAYOUT_HEIGHT, LAYOUT_WIDTH } from '../constants.ts'

export const MidiPadSlide = () => {
  const res = Result.all({
    accords: Hooks.useAtomValue(accordsAtom),
    patterns: Hooks.useAtomValue(patternsAtom),
    strengths: Hooks.useAtomValue(strengthsAtom),
  })

  Hooks.useAtomMount(testAtom)

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
          <PatternButton pattern={pattern} key={pattern} />
        ))}
      </DisplayContentsWrapper>
      <DisplayContentsWrapper role="row" aria-rowindex={1}>
        {Array.from(accords, accord => (
          <AccordButton accord={accord} key={accord} />
        ))}
      </DisplayContentsWrapper>
      <DisplayContentsWrapper role="row" aria-rowindex={2}>
        {Array.from(strengths, strength => (
          <StrengthButton strength={strength} key={strength} />
        ))}
        {/* <PlaybackButton /> */}
      </DisplayContentsWrapper>
    </ButtonGrid>
  )
}

const PatternButton = ({ pattern }: { pattern: Pattern }) => {
  // const isPressableRes = Hooks.useAtomValue(
  //   isPatternButtonPressableAtom(pattern),
  // )
  const isSelectedRes = Hooks.useAtomValue(isPatternSelectedAtom(pattern))
  const isPressedRes = Hooks.useAtomValue(isPatternPressedAtom(pattern))
  // const isPlayingRes = Hooks.useAtomValue(
  //   isPatternButtonCurrentlyPlayingAtom(pattern),
  // )
  const downloadPercentRes = Hooks.useAtomValue(
    patternButtonDownloadPercentAtom(pattern),
  )
  // if (!Result.isSuccess(isPlayingRes)) {
  //   console.log(`wtf. pattern №${pattern}. isPlayingRes`, isPlayingRes)
  //   return 'wtf'
  // }
  // if (!Result.isSuccess(isPressableRes)) {
  //   console.log(`wtf. pattern № ${pattern} isPressableRes`, isPressableRes)
  //   return 'wtf'
  // }
  if (!Result.isSuccess(isSelectedRes)) {
    console.log(`wtf. pattern № ${pattern} isSelectedRes`, isSelectedRes)
    return 'wtf'
  }
  if (!Result.isSuccess(isPressedRes)) {
    console.log(`wtf. pattern № ${pattern} isPressedRes`, isPressedRes)
    return 'wtf'
  }
  if (!Result.isSuccess(downloadPercentRes)) {
    console.log(
      `wtf. pattern № ${pattern} downloadPercentRes`,
      downloadPercentRes,
    )
    return 'wtf'
  }
  // const { value: isPressable } = isPressableRes
  const { value: isSelected } = isSelectedRes
  const { value: isPressed } = isPressedRes
  // const { value: isPlaying } = isPlayingRes
  const { value: downloadPercent } = downloadPercentRes

  return (
    <DebugButton data-pattern={pattern}>
      Pattern: {pattern}
      {/* <br />
      Pressable: {isPressable ? Yes : No} */}
      <br />
      Selected: {isSelected ? Yes : No}
      <br />
      Pressed: {isPressed ? Yes : No}
      <br />
      {/* Playing: {isPlaying ? Yes : No}
      <br /> */}
      Fetched: {downloadPercent}%
    </DebugButton>
  )
  // return (
  //   <NeumorphicButton
  //     data-is-externally-active={false}
  //     data-button-id={pattern}
  //     role="gridcell"
  //     aria-colindex={pattern}
  //     type="button"
  //     aria-label={'Pattern №' + (pattern + 1)}
  //     children={pattern}
  //   />
  // )
}

const AccordButton = ({ accord }: { accord: Accord }) => {
  // const isPressableRes = Hooks.useAtomValue(isAccordButtonPressableAtom(accord))
  const isSelectedRes = Hooks.useAtomValue(isAccordSelectedAtom(accord))
  const isPressedRes = Hooks.useAtomValue(isAccordPressedAtom(accord))
  // const isPlayingRes = Hooks.useAtomValue(
  //   isAccordButtonCurrentlyPlayingAtom(accord),
  // )
  const downloadPercentRes = Hooks.useAtomValue(
    accordButtonDownloadPercentAtom(accord),
  )
  // if (!Result.isSuccess(isPlayingRes)) {
  //   console.log(`wtf. accord №${accord}. isPlayingRes`, isPlayingRes)
  //   return 'wtf'
  // }
  // if (!Result.isSuccess(isPressableRes)) {
  //   console.log(`wtf accord №${accord}. isPressableRes`, isPressableRes)
  //   return 'wtf'
  // }
  if (!Result.isSuccess(isSelectedRes)) {
    console.log(`wtf accord №${accord}. isSelectedRes`, isSelectedRes)
    return 'wtf'
  }
  if (!Result.isSuccess(isPressedRes)) {
    console.log(`wtf accord №${accord}. isPressedRes`, isPressedRes)
    return 'wtf'
  }
  if (!Result.isSuccess(downloadPercentRes)) {
    console.log(`wtf accord №${accord}. downloadPercentRes`, downloadPercentRes)
    return 'wtf'
  }

  // const { value: isPressable } = isPressableRes
  const { value: isSelected } = isSelectedRes
  const { value: isPressed } = isPressedRes
  // const { value: isPlaying } = isPlayingRes
  const { value: downloadPercent } = downloadPercentRes

  return (
    <DebugButton data-accord={accord}>
      Accord: {accord}
      {/* <br />
      Pressable: {isPressable ? Yes : No} */}
      <br />
      Selected: {isSelected ? Yes : No}
      <br />
      Pressed: {isPressed ? Yes : No}
      <br />
      {/* Playing: {isPlaying ? Yes : No}
      <br /> */}
      Fetched: {downloadPercent}%
    </DebugButton>
  )
  // return (
  //   <NeumorphicButton
  //     data-is-externally-active={false}
  //     data-button-id={accord}
  //     role="gridcell"
  //     aria-colindex={accord}
  //     type="button"
  //     aria-label={accord}
  //     children={accord}
  //   />
  // )
}

const StrengthButton = ({ strength }: { strength: Strength }) => {
  // const isPressableRes = Hooks.useAtomValue(
  //   isStrengthButtonPressableAtom(strength),
  // )
  const isSelectedRes = Hooks.useAtomValue(isStrengthSelectedAtom(strength))
  const isPressedRes = Hooks.useAtomValue(isStrengthPressedAtom(strength))
  // const isPlayingRes = Hooks.useAtomValue(
  //   isStrengthButtonCurrentlyPlayingAtom(strength),
  // )
  const downloadPercentRes = Hooks.useAtomValue(
    strengthButtonDownloadPercentAtom(strength),
  )
  // if (!Result.isSuccess(isPlayingRes)) {
  //   console.log(`wtf. strength ${strength}. isPlayingRes`, isPlayingRes)
  //   return 'wtf'
  // }
  // if (!Result.isSuccess(isPressableRes)) {
  //   console.log(`wtf. strength ${strength}. isPressableRes`, isPressableRes)
  //   return 'wtf'
  // }
  if (!Result.isSuccess(isSelectedRes)) {
    console.log(`wtf. strength ${strength}. isSelectedRes`, isSelectedRes)
    return 'wtf'
  }
  if (!Result.isSuccess(isPressedRes)) {
    console.log(`wtf. strength ${strength}. isPressedRes`, isPressedRes)
    return 'wtf'
  }
  if (!Result.isSuccess(downloadPercentRes)) {
    console.log(
      `wtf. strength ${strength}. downloadPercentRes`,
      downloadPercentRes,
    )
    return 'wtf'
  }

  // const { value: isPressable } = isPressableRes
  const { value: isSelected } = isSelectedRes
  const { value: isPressed } = isPressedRes
  // const { value: isPlaying } = isPlayingRes
  const { value: downloadPercent } = downloadPercentRes

  return (
    <DebugButton data-strength={strength}>
      Strength: {strength}
      <br />
      {/* Pressable: {isPressable ? Yes : No}
      <br /> */}
      Selected: {isSelected ? Yes : No}
      <br />
      Pressed: {isPressed ? Yes : No}
      <br />
      {/* Playing: {isPlaying ? Yes : No}
      <br /> */}
      Fetched: {downloadPercent}%
    </DebugButton>
  )
  // return (
  //   <NeumorphicButton
  //     data-is-externally-active={false}
  //     data-button-id={strength}
  //     role="gridcell"
  //     aria-colindex={strength}
  //     type="button"
  //     aria-label={strength}
  //     children={strength}
  //   />
  // )
}

// const PlaybackButton = () => {
//   const isPressableRes = Hooks.useAtomValue(isPlayStopButtonPressableAtom)
//   const [_playresult, playPause] = Hooks.useAtom(switchPlayPauseFnAtom)
//   if (!Result.isSuccess(isPressableRes)) {
//     console.log(`wtf playback button. isPressableRes`, isPressableRes)
//     return 'wtf'
//   }
//   const { value: isPressable } = isPressableRes
//   return (
//     <DebugButton
//       onMouseDown={() => {
//         if (isPressable) playPause()
//       }}
//     >
//       Playback control
//       <br />
//       Shape: triangle
//       <br />
//       Pressable: {isPressable ? Yes : No}
//     </DebugButton>
//   )
// }

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
  --viewport-horizontal-size: 90vw;
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

const _NeumorphicButton = styled(BaseButton)<{
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
