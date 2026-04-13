const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.DATABASE_URL;

async function checkConnection() {
  if (!uri) {
    console.error("❌ DATABASE_URL is not set in .env");
    return;
  }
  
  console.log("=================================");
  console.log("🔍 Checking MongoDB Connection...");
  console.log("=================================");
  
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log("✅ SUCCESS! Connected to MongoDB Atlas.");
    console.log("Your IP is correctly whitelisted.");
    await client.close();
  } catch (error) {
    console.error("\n❌ MONGODB CONNECTION FAILED!");
    console.error("Reason:", error.message);
    console.error("\n👉 THIS IS LIKELY CAUSING YOUR BACKEND TO CRASH!");
    console.error("👉 FIX: Go to MongoDB Atlas (cloud.mongodb.com) -> Network Access -> Add your current IP address.");
  }
}
checkConnection();
