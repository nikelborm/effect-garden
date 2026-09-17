import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export type InputConfig = Readonly<{
  repo: Readonly<{
    owner: string
    name: string
  }>
  pathToEntityInRepo: string
  gitRef: string
}>

export class InputConfigTag extends Context.Service<
  InputConfigTag,
  InputConfig
>()('InputConfig') {}

export type OutputConfig = Readonly<{
  localPathAtWhichEntityFromRepoWillBeAvailable: string
}>

export class OutputConfigTag extends Context.Service<
  OutputConfigTag,
  OutputConfig
>()('OutputConfig') {}

const InputConfigLive = (inputConfig: InputConfig) =>
  Layer.succeed(InputConfigTag, InputConfigTag.of(inputConfig))

export const provideInputConfig = (inputConfig: InputConfig) =>
  Effect.provide(InputConfigLive(inputConfig))

const OutputConfigLive = (outputConfig: OutputConfig) =>
  Layer.succeed(OutputConfigTag, OutputConfigTag.of(outputConfig))

export type SingleTargetConfig = InputConfig & OutputConfig

export const provideSingleDownloadTargetConfig = ({
  localPathAtWhichEntityFromRepoWillBeAvailable,
  ...inputConfig
}: SingleTargetConfig): (<A, E, R>(
  self: Effect.Effect<A, E, R>,
) => Effect.Effect<A, E, Exclude<R, InputConfigTag | OutputConfigTag>>) =>
  Effect.provide(
    Layer.merge(
      InputConfigLive(inputConfig),
      OutputConfigLive({
        localPathAtWhichEntityFromRepoWillBeAvailable,
      }),
    ),
  )
