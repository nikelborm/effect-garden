import { GenericTag } from 'effect/Context';
import { type Effect, provide } from 'effect/Effect';
import { merge, succeed } from 'effect/Layer';

export type InputConfig = Readonly<{
  repo: Readonly<{
    owner: string;
    name: string;
  }>;
  pathToEntityInRepo: string;
  gitRef: string;
}>;

export const InputConfigTag = GenericTag<InputConfig>('InputConfig');

export type OutputConfig = Readonly<{
  localPathAtWhichEntityFromRepoWillBeAvailable: string;
}>;

export const OutputConfigTag = GenericTag<OutputConfig>('OutputConfig');

const InputConfigLive = (inputConfig: InputConfig) =>
  succeed(InputConfigTag, InputConfigTag.of(inputConfig));

export const provideInputConfig = (inputConfig: InputConfig) =>
  provide(InputConfigLive(inputConfig));

const OutputConfigLive = (outputConfig: OutputConfig) =>
  succeed(OutputConfigTag, OutputConfigTag.of(outputConfig));

export type SingleTargetConfig = InputConfig & OutputConfig;

export const provideSingleDownloadTargetConfig = ({
  localPathAtWhichEntityFromRepoWillBeAvailable,
  ...inputConfig
}: SingleTargetConfig): (<A, E, R>(
  self: Effect<A, E, R>,
) => Effect<A, E, Exclude<R, InputConfig | OutputConfig>>) =>
  provide(
    merge(
      InputConfigLive(inputConfig),
      OutputConfigLive({
        localPathAtWhichEntityFromRepoWillBeAvailable,
      }),
    ),
  );
