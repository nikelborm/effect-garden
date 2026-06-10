import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto/build/src/platform/browser'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto/build/src/platform/browser'
// import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http/build/esm/platform/browser'
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http/build/esm/platform/browser'
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs/build/esm/platform/browser'
// import { OTLPMetricExporter as ProtoOTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto/build/src/platform/browser'
// import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import {
  BatchSpanProcessor,
  type BufferConfig,
  type ReadableSpan,
  SimpleSpanProcessor,
  type SpanExporter,
} from '@opentelemetry/sdk-trace-base'

import * as WebSdk from '@effect/opentelemetry/WebSdk'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
// import * as LogLevel from 'effect/LogLevel'

export interface ByteAwareBufferConfig extends BufferConfig {
  maxBatchBytes?: number
}

export class ByteAwareBatchSpanProcessor extends BatchSpanProcessor {
  private readonly maxBatchBytes: number
  private currentBytes = 0

  constructor(exporter: SpanExporter, config: ByteAwareBufferConfig = {}) {
    super(exporter, config)
    this.maxBatchBytes = config.maxBatchBytes ?? 4 * 1024 * 1024
  }

  override onEnd(span: ReadableSpan): void {
    const spanBytes = this.estimateBytes(span)

    if (this.currentBytes + spanBytes >= this.maxBatchBytes) {
      this.forceFlush()
      this.currentBytes = 0
    }

    this.currentBytes += spanBytes
    super.onEnd(span)
  }

  private estimateBytes(span: ReadableSpan): number {
    return JSON.stringify({
      traceId: span.spanContext().traceId,
      spanId: span.spanContext().spanId,
      name: span.name,
      kind: span.kind,
      startTime: span.startTime,
      endTime: span.endTime,
      attributes: span.attributes,
      status: span.status,
      events: span.events,
      links: span.links,
    }).length
  }
}

export const TracingLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    // const AXIOM_API_KEY = yield* Config.redacted('AXIOM_API_KEY');

    // TODO: maybe infer from NODE_ENV?
    // Example: `dev` dataset
    // const dataset = yield* Config.nonEmptyString('OTEL_DATASET_NAME');
    const compression = CompressionAlgorithm.GZIP

    // https://api.axiom.co for the US region, and
    // https://api.eu.axiom.co for the EU region
    return WebSdk.layer(() => ({
      resource: {
        serviceName: 'next-midi-demo-web-dev',
        // serviceVersion: '12',
        // TODO infer serviceVersion from commit hash or from git tag or from release
      },
      logRecordProcessor: new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: `/api/otel/logs`,
          // compression,
        }),
        {
          maxExportBatchSize: 128,
          maxQueueSize: 1024,
        },
      ),
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({ url: `/api/otel/traces` }),
        // {
        //   maxBatchBytes: 24_999,
        // },
      ),
      // metricReader: new PeriodicExportingMetricReader({
      //   exporter: new ProtoOTLPMetricExporter({
      //     url: `https://api.axiom.co/v1/metrics`,
      //     compression,
      //   }),
      // }),
    }))
  }),
)
