const { MongoClient } = require("mongodb");
require("dotenv").config();

let client;
let db;

async function connectDB() {
  if (db) return db;
  try {
    client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log(`✅ Connected to MongoDB: ${process.env.DB_NAME}`);
    return db;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

function getDB() {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db;
}

module.exports = { connectDB, getDB };
