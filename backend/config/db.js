const mongoose = require("mongoose");
const { Resolver } = require("dns").promises;

// Google DNS — bypasses Windows DNS that times out on MongoDB Atlas SRV/TXT records
const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

/**
 * Manually resolves mongodb+srv:// to direct mongodb:// URI using Google DNS.
 * This bypasses the MongoDB driver's internal DNS which times out on Windows.
 */
async function resolveSrvToDirectUri(srvUri) {
  const match = srvUri.match(/mongodb\+srv:\/\/([^@]+)@([^/?]+)(.*)/);
  if (!match) return srvUri;

  const [, credentials, srvHost] = match;

  // 1. Resolve SRV records → get actual shard hostnames + port
  const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${srvHost}`);
  const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");

  // 2. Try to resolve TXT record for extra options (replicaSet name etc.)
  let extraOptions = "";
  try {
    const txtRecords = await resolver.resolveTxt(srvHost);
    extraOptions = txtRecords.flat().join("&");
  } catch {
    // TXT timed out — use known Atlas defaults
    extraOptions = "authSource=admin";
  }

  // 3. Build direct URI — no SRV, no TXT lookup by driver
  return `mongodb://${credentials}@${hosts}/?ssl=true&${extraOptions}`;
}

const connectDB = async () => {
  try {
    const srvUri = process.env.MONGO_URI;
    if (!srvUri) throw new Error("MONGO_URI not set in .env");

    console.log("🔍 Resolving Atlas cluster via Google DNS...");
    const directUri = await resolveSrvToDirectUri(srvUri);
    console.log("✅ Hosts resolved — connecting to MongoDB Atlas...");

    await mongoose.connect(directUri, {
      family: 4,                       // Force IPv4
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    await seedDefaultCategories();
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

async function seedDefaultCategories() {
  const Category = require("../models/Category");
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany([
        { name: "Food & Dining",            type: "expense", is_default: true },
        { name: "Transport",                type: "expense", is_default: true },
        { name: "Hostel & Rent",            type: "expense", is_default: true },
        { name: "Academics & Books",        type: "expense", is_default: true },
        { name: "Entertainment",            type: "expense", is_default: true },
        { name: "Utilities & Internet",     type: "expense", is_default: true },
        { name: "Personal Care",            type: "expense", is_default: true },
        { name: "Pocket Money / Allowance", type: "income",  is_default: true },
        { name: "Part-time Job / Salary",   type: "income",  is_default: true },
        { name: "Scholarship",              type: "income",  is_default: true },
        { name: "Freelance",                type: "income",  is_default: true },
        { name: "Other Income",             type: "income",  is_default: true },
      ]);
      console.log("✅ Default categories seeded.");
    }
  } catch (err) {
    console.error("⚠️  Seed error:", err.message);
  }
}

module.exports = connectDB;
