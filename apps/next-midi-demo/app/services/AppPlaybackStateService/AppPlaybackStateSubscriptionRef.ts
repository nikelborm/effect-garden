import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type { AppPlaybackState } from './index.ts'
import { SilenceState } from './Machine/Silence🏁.ts'

export class AppPlaybackStateSubscriptionRef extends Context.Service<
  AppPlaybackStateSubscriptionRef,
  SubscriptionRef.SubscriptionRef<AppPlaybackState>
>()(
  'next-midi-demo/app/services/AppPlaybackStateService/AppPlaybackStateSubscriptionRef',
) {}

export const AppPlaybackStateSubscriptionRefLayer = Layer.effect(
  AppPlaybackStateSubscriptionRef,
  SubscriptionRef.make<AppPlaybackState>(SilenceState.default),
)
