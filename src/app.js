const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const correlationId = require("./middleware/correlationId");
const { requestLogger } = require("./middleware/logger");
const { metricsMiddleware, metricsHandler } = require("./middleware/metrics");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

app.use(express.json());
app.use(correlationId);
app.use(metricsMiddleware);
app.use(requestLogger);

const SERVICE_NAME = process.env.SERVICE_NAME || "unknown-service";

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
});

app.get("/metrics", metricsHandler);

const openapiSpec = YAML.load(path.join(__dirname, "../docs/openapi.yaml"));
app.get("/openapi.json", (req, res) => res.json(openapiSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }));

app.use("/v1", routes);

app.use((req, res) => {
  res.status(404).json({
    code: "ROUTE_NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    correlationId: req.correlationId,
  });
});

app.use(errorHandler);

module.exports = app;
