import { Atom, Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { styled } from '@linaria/react'
import * as EArray from 'effect/Array'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Record from 'effect/Record'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'
import * as EString from 'effect/String'
import * as EMIDIAccess from 'effect-web-midi/EMIDIAccess'
import type * as EMIDIPort from 'effect-web-midi/EMIDIPort'

const profileStoreAtom = Atom.make({})

const currentGridWidthAtom = Atom.make(0)

const currentGridHeightAtom = Atom.make(0)
