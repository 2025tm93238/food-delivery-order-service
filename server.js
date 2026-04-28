require("dotenv").config();
require("./tracing");
const app = require("./src/app");
const { connectDB } = require("./src/config/db");

const PORT = process.env.PORT || 3003;
const SERVICE_NAME = process.env.SERVICE_NAME || "unknown-service";

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`${SERVICE_NAME} running on port ${PORT}`);
  });
});
