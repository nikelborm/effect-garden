import { Select as BaseSelect } from '@base-ui/react/select'
import { css } from '@linaria/core'
import { styled } from '@linaria/react'
import type * as React from 'react'

export function ChevronUpDownSVG(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <title>⇳</title>
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  )
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentcolor"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      {...props}
    >
      <title>✓</title>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  )
}

export const SelectTrigger = styled(BaseSelect.Trigger)`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: 2.5rem;
  padding-left: 0.875rem;
  padding-right: 0.75rem;
  margin: 0;
  outline: 0;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  background-color: canvas;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--color-gray-900);
  -webkit-user-select: none;
  user-select: none;
  min-width: 9rem;

  @media (hover: hover) {
    &:hover:not([data-disabled]) {
      background-color: var(--color-gray-100);
    }
  }

  &[data-disabled] {
    color: var(--color-gray-500);
  }

  &[data-popup-open] {
    background-color: var(--color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
`

export const SelectRoot = BaseSelect.Root
export const SelectPortal = BaseSelect.Portal
export const SelectValue = BaseSelect.Value
export const Backdrop = BaseSelect.Backdrop
export const Group = BaseSelect.Group
export const GroupLabel = BaseSelect.GroupLabel
export const Separator = BaseSelect.Separator

export const SelectIcon = BaseSelect.Icon

export const SelectPositioner = styled(BaseSelect.Positioner)`
  outline: none;
  z-index: 1;
  -webkit-user-select: none;
  user-select: none;
`

export const SelectPopup = styled(BaseSelect.Popup)`
  box-sizing: border-box;
  border-radius: 0.375rem;
  background-color: canvas;
  background-clip: padding-box;
  color: var(--color-gray-900);
  min-width: var(--anchor-width);
  transform-origin: var(--transform-origin);
  transition:
    transform 150ms,
    opacity 150ms;

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
    transform: scale(0.9);
  }

  &[data-side='none'] {
    transition: none;
    transform: none;
    opacity: 1;
    min-width: calc(var(--anchor-width) + 1rem);
  }

  @media (prefers-color-scheme: light) {
    outline: 1px solid var(--color-gray-200);
    box-shadow:
      0 10px 15px -3px var(--color-gray-200),
      0 4px 6px -4px var(--color-gray-200);
  }

  @media (prefers-color-scheme: dark) {
    outline: 1px solid var(--color-gray-300);
  }
`

export const SelectList = styled(BaseSelect.List)`
  box-sizing: border-box;
  position: relative;
  padding-block: 0.25rem;
  overflow-y: auto;
  max-height: var(--available-height);
  scroll-padding-block: 1.5rem;
`

export const SelectArrow = styled(BaseSelect.Arrow)`
  display: flex;

  &[data-side='top'] {
    bottom: -8px;
    rotate: 180deg;
  }

  &[data-side='bottom'] {
    top: -8px;
    rotate: 0deg;
  }

  &[data-side='left'] {
    right: -13px;
    rotate: 90deg;
  }

  &[data-side='right'] {
    left: -13px;
    rotate: -90deg;
  }
`

export const SelectItem = styled(BaseSelect.Item)`
  box-sizing: border-box;
  outline: 0;
  font-size: 0.875rem;
  line-height: 1rem;
  padding-block: 0.5rem;
  padding-left: 0.625rem;
  padding-right: 1rem;
  display: grid;
  gap: 0.5rem;
  align-items: center;
  grid-template-columns: 0.75rem 1fr;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;

  @media (pointer: coarse) {
    padding-block: 0.625rem;
    font-size: 0.925rem;
  }

  [data-side='none'] & {
    font-size: 1rem;
    padding-right: 3rem;
  }

  &[data-highlighted] {
    z-index: 0;
    position: relative;
    color: var(--color-gray-50);
  }

  &[data-highlighted]::before {
    content: '';
    z-index: -1;
    position: absolute;
    inset-block: 0;
    inset-inline: 0.25rem;
    border-radius: 0.25rem;
    background-color: var(--color-gray-900);
  }
`

export const SelectItemIndicator = styled(BaseSelect.ItemIndicator)`
  grid-column-start: 1;
`

export const SelectItemIndicatorIcon = styled(CheckIcon)`
  display: block;
  width: 0.75rem;
  height: 0.75rem;
`

export const SelectItemText = styled(BaseSelect.ItemText)`
  grid-column-start: 2;
`

export const selectScrollArrow = css`
  width: 100%;
  background: canvas;
  z-index: 1;
  text-align: center;
  cursor: pointer;
  border-radius: 0.375rem;
  height: 1rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
  }
`

export const SelectScrollUpArrow = styled(BaseSelect.ScrollUpArrow)`
  ${selectScrollArrow};

  &[data-side='none'] {
    &::before {
      top: -100%;
    }
  }
`

export const SelectScrollDownArrow = styled(BaseSelect.ScrollDownArrow)`
  ${selectScrollArrow};

  bottom: 0;

  &[data-side='none'] {
    &::before {
      bottom: -100%;
    }
  }
`
