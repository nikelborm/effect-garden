import { Layer, ManagedRuntime } from 'effect'
import { BrowserRuntime } from '@effect/platform-browser'

export const AppLayer = Layer.empty

export const AppRuntime = ManagedRuntime.make(AppLayer)

BrowserRuntime
