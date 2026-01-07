import { BrowserRuntime } from '@effect/platform-browser'
import { Layer, ManagedRuntime } from 'effect'

export const AppLayer = Layer.empty

export const AppRuntime = ManagedRuntime.make(AppLayer)

BrowserRuntime
