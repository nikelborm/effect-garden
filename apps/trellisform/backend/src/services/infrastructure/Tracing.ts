import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'

import * as NodeSdk from '@effect/opentelemetry/NodeSdk'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export const TracingLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    // const AXIOM_API_KEY = yield* Config.redacted('AXIOM_API_KEY');
    const AXIOM_API_KEY = 'xaat-16c3c461-ab00-41cb-ac23-abe01363975e'
    // TODO: maybe infer from NODE_ENV?
    // Example: `dev` dataset
    // const dataset = yield* Config.nonEmptyString('OTEL_DATASET_NAME');
    const dataset = 'dev'

    // https://api.axiom.co for the US region, and
    // https://api.eu.axiom.co for the EU region
    return NodeSdk.layer(() => ({
      resource: {
        serviceName: 'backend-effect-ts',
        // TODO infer serviceVersion from commit hash or from git tag or from release
      },
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: `https://api.axiom.co/v1/traces`,
          headers: {
            Authorization: `Bearer ${AXIOM_API_KEY}`,
            'X-Axiom-Dataset': dataset,
          },
        }),
      ),
    }))
  }),
)
