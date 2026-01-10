// import * as BrowserRuntime from '@effect/platform-browser/BrowserRuntime'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'

export const AppLayer = Layer.empty

export const AppRuntime = ManagedRuntime.make(AppLayer)
