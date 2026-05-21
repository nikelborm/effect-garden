import { Octokit, type OctokitOptions } from '@octokit/core'

import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
type OctokitTag = Context.Tag<Octokit, Octokit>

export const OctokitTag: OctokitTag = Context.GenericTag<Octokit>('OctokitTag')

export const OctokitLayer: (
  options?: OctokitOptions,
) => Layer.Layer<Octokit, never, never> = (options?: OctokitOptions) =>
  Layer.succeed(OctokitTag, OctokitTag.of(new Octokit(options)))
