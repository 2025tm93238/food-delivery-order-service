const { NodeSDK } = require("@opentelemetry/sdk-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");

const SERVICE_NAME = process.env.SERVICE_NAME || "unknown-service";
const OTEL_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://jaeger:4318/v1/traces";

const sdk = new NodeSDK({
  serviceName: SERVICE_NAME,
  traceExporter: new OTLPTraceExporter({ url: OTEL_ENDPOINT }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

try {
  sdk.start();
  console.log(`[otel] tracing started for ${SERVICE_NAME} → ${OTEL_ENDPOINT}`);
} catch (err) {
  console.error("[otel] failed to start tracing:", err);
}

const shutdown = () => {
  sdk
    .shutdown()
    .catch((err) => console.error("[otel] shutdown error:", err))
    .finally(() => process.exit(0));
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
