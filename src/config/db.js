const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Order DB connected");
    await sequelize.sync({ alter: true });
  } catch (err) {
    console.error("Order DB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
