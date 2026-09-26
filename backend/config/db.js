const mongoose = require("mongoose");

// ─── Connection cache (prevents new connection on every serverless invocation) ─
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

/**
 * Resolves SRV locally on Windows dev (where Windows DNS blocks TXT records).
 * On Vercel/Linux servers, the standard SRV URI works fine — skip this.
 */
async function buildUri(srvUri) {
  const isWindows = process.platform === "win32";
  const isVercel  = !!process.env.VERCEL;

  // On Vercel or non-Windows: use the SRV URI directly — it works
  if (isVercel || !isWindows) return srvUri;

  // Local Windows dev: manually resolve SRV via Google DNS to bypass Windows DNS timeout
  try {
    const { Resolver } = require("dns").promises;
    const resolver = new Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);

    const match = srvUri.match(/mongodb\+srv:\/\/([^@]+)@([^/?]+)(.*)/);
    if (!match) return srvUri;

    const [, credentials, srvHost] = match;
    const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${srvHost}`);
    const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");

    let extraOptions = "authSource=admin";
    try {
      const txtRecords = await resolver.resolveTxt(srvHost);
      extraOptions = txtRecords.flat().join("&");
    } catch { /* TXT lookup may still fail — use default */ }

    return `mongodb://${credentials}@${hosts}/?ssl=true&${extraOptions}`;
  } catch (err) {
    console.warn("⚠️  Local SRV resolve failed, using original URI:", err.message);
    return srvUri;
  }
}

const connectDB = async () => {
  // Return cached connection if already open
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const srvUri = process.env.MONGO_URI;
    if (!srvUri) throw new Error("MONGO_URI not set in .env");

    const uri = await buildUri(srvUri);

    cached.promise = mongoose.connect(uri, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      bufferCommands: false,
    }).then((m) => {
      console.log(`✅ MongoDB Connected: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // reset so next request can retry
    console.error("❌ MongoDB Connection Error:", err.message);
    throw err; // let the request handler return 500, don't exit
  }

  await seedDefaultCategories();
  return cached.conn;
};

async function seedDefaultCategories() {
  try {
    const Category = require("../models/Category");
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
