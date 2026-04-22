const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Order = require("./Order");

const OrderItem = sequelize.define("OrderItem", {
  order_item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
  order_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Order, key: "order_id" } },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { timestamps: false, tableName: "order_items" });

Order.hasMany(OrderItem, { foreignKey: "order_id", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });

module.exports = OrderItem;
