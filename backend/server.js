const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

const app = express();

// ── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── DB connection middleware (cached — only connects once, works on Vercel) ──
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err.message);
    res.status(500).json({ success: false, message: "Database connection failed." });
  }
});

// Welcome route / API Health Check
app.get("/", (req, res) => {
  res.json({
    name: "CampusCoin API",
    status: "online",
    database: "MongoDB",
    message: "Welcome to CampusCoin Backend API. Designed with Express & MVC.",
    endpoints: {
      auth: "/api/auth",
      categories: "/api/categories",
      transactions: "/api/transactions",
      budgets: "/api/budgets",
      insights: "/api/insights",
    },
  });
});

// Mount Routes (MVC)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/insights", require("./routes/insightRoutes"));

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start Server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`=========================================`);
//   console.log(` CampusCoin Server is running on port ${PORT}`);
//   console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
//   console.log(` Base URL: http://localhost:${PORT}`);
//   console.log(`=========================================`);
// });
module.exports = app;
