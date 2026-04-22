require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const fs = require("fs");
const readline = require("readline");
const { connectDB } = require("../src/config/db");
const Order = require("../src/models/Order");
const OrderItem = require("../src/models/OrderItem");

async function parseCSV(filePath) {
  const results = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });
  let headers = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!headers) {
      headers = line.split(",").map((h) => h.trim());
    } else {
      const values = line.split(",").map((v) => v.trim());
      const obj = {};
      headers.forEach((h, i) => (obj[h] = values[i] ?? null));
      results.push(obj);
    }
  }
  return results;
}

// Lookup maps for denormalized projections
const RESTAURANT_NAMES = {
  1:"Tasty Garden",2:"Green Diner",3:"Urban Bite",4:"Mama House",5:"Golden Kitchen",
  6:"Coastal Garden",7:"Fusion Plate",8:"Royal Garden",9:"Spice Hub",10:"Coastal House",
  11:"Street Garden",12:"Tasty Kitchen",13:"Spice Garden",14:"Tasty Kitchen",15:"Urban Hub",
  16:"Fusion House",17:"Mama House",18:"Mama Kitchen",19:"Fusion Bite",20:"Royal House",
  21:"Royal Bite",22:"Spice Hub",23:"Coastal Treats",24:"Urban Diner",25:"Golden Table",
  26:"Spice Kitchen",27:"Golden House",28:"Royal Kitchen",29:"Fusion Kitchen",30:"Coastal Diner",
  31:"Mama Plate",32:"Spice Diner",33:"Golden Corner",34:"Royal Corner",35:"Urban Table",
  36:"Royal Plate",37:"Urban Garden",38:"Coastal House",39:"Fusion Bite",40:"Spice House",
};

const ADDRESS_CITIES = {
  1:"Kolkata",2:"Hyderabad",3:"Mumbai",4:"Kolkata",5:"Chennai",6:"Delhi",7:"Mumbai",
  8:"Chennai",9:"Chennai",10:"Mumbai",11:"Ahmedabad",12:"Bengaluru",13:"Hyderabad",
  14:"Mumbai",15:"Pune",16:"Pune",17:"Chennai",18:"Chennai",19:"Bengaluru",20:"Delhi",
  21:"Pune",22:"Bengaluru",23:"Hyderabad",24:"Hyderabad",25:"Pune",26:"Mumbai",
  27:"Mumbai",28:"Pune",29:"Delhi",30:"Ahmedabad",31:"Ahmedabad",32:"Delhi",33:"Chennai",
  34:"Ahmedabad",35:"Mumbai",36:"Delhi",37:"Ahmedabad",38:"Pune",39:"Ahmedabad",
  40:"Kolkata",41:"Bengaluru",42:"Hyderabad",43:"Bengaluru",44:"Kolkata",45:"Kolkata",
  46:"Pune",47:"Delhi",48:"Kolkata",49:"Bengaluru",50:"Kolkata",51:"Kolkata",52:"Ahmedabad",
  53:"Delhi",54:"Pune",55:"Bengaluru",56:"Chennai",57:"Kolkata",58:"Pune",59:"Ahmedabad",
  60:"Bengaluru",61:"Pune",62:"Ahmedabad",63:"Delhi",64:"Mumbai",65:"Delhi",66:"Delhi",
  67:"Bengaluru",68:"Mumbai",69:"Kolkata",70:"Kolkata",71:"Kolkata",72:"Chennai",
  73:"Ahmedabad",74:"Delhi",75:"Hyderabad",76:"Pune",77:"Bengaluru",78:"Bengaluru",
  79:"Pune",80:"Pune",81:"Hyderabad",82:"Kolkata",
};

async function seed() {
  if (!process.env.DB_NAME) {
    console.error("❌ DB_NAME not set in .env");
    process.exit(1);
  }

  try {
    await connectDB();
  } catch {
    console.error("❌ Cannot connect to PostgreSQL.");
    console.error("   Start it with: brew services start postgresql");
    console.error(`   DB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    process.exit(1);
  }

  const dataDir = require("path").resolve(__dirname, "data");
  const ordersFile = `${dataDir}/ofd_orders.csv`;
  const orderItemsFile = `${dataDir}/ofd_order_items.csv`;

  if (!fs.existsSync(ordersFile) || !fs.existsSync(orderItemsFile)) {
    console.error("❌ Missing CSV files in seeds/data/");
    console.error("   Required: ofd_orders.csv, ofd_order_items.csv");
    process.exit(1);
  }

  const ordersRaw = await parseCSV(ordersFile);
  const orderItemsRaw = await parseCSV(orderItemsFile);

  await OrderItem.destroy({ where: {} });
  await Order.destroy({ where: {} });

  const orders = ordersRaw.map((r) => ({
    order_id: parseInt(r.order_id),
    customer_id: parseInt(r.customer_id),
    restaurant_id: parseInt(r.restaurant_id),
    address_id: parseInt(r.address_id),
    order_status: r.order_status,
    order_total: parseFloat(r.order_total),
    payment_status: r.payment_status,
    created_at: new Date(r.created_at),
    restaurant_name: RESTAURANT_NAMES[parseInt(r.restaurant_id)] || null,
    address_city: ADDRESS_CITIES[parseInt(r.address_id)] || null,
  }));

  const orderItems = orderItemsRaw.map((r) => ({
    order_item_id: parseInt(r.order_item_id),
    order_id: parseInt(r.order_id),
    item_id: parseInt(r.item_id),
    quantity: parseInt(r.quantity),
    price: parseFloat(r.price),
  }));

  await Order.bulkCreate(orders);
  await OrderItem.bulkCreate(orderItems);

  console.log(`✅ Seeded ${orders.length} orders, ${orderItems.length} order items`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
