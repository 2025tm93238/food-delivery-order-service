const express = require("express");
const app = express();

app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || "unknown-service";

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;