import { Octokit, type OctokitOptions } from '@octokit/core'

import { GenericTag, type Tag } from 'effect/Context'
import { type Layer, succeed } from 'effect/Layer'

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
type OctokitTag = Tag<Octokit, Octokit>

export const OctokitTag: OctokitTag = GenericTag<Octokit>('OctokitTag')

export const OctokitLayer: (
  options?: OctokitOptions,
) => Layer<Octokit, never, never> = (options?: OctokitOptions) =>
  succeed(OctokitTag, OctokitTag.of(new Octokit(options)))
