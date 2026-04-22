const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Order = sequelize.define("Order", {
  order_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  restaurant_id: { type: DataTypes.INTEGER, allowNull: false },
  address_id: { type: DataTypes.INTEGER, allowNull: false },
  order_status: {
    type: DataTypes.ENUM("CREATED", "CONFIRMED", "PREPARING", "READY", "DISPATCHED", "DELIVERED", "CANCELLED"),
    allowNull: false,
  },
  order_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  payment_status: {
    type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED"),
    allowNull: false,
  },
  created_at: { type: DataTypes.DATE },
  // Denormalized projections
  restaurant_name: { type: DataTypes.STRING },
  address_city: { type: DataTypes.STRING },
}, { timestamps: false, tableName: "orders" });

module.exports = Order;
