const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: "Database connection failed." });
  }
});

app.get("/", (req, res) => {
  res.json({
    name: "CampusCoin API",
    status: "online",
    database: "MongoDB",
    message: "Welcome to CampusCoin Backend API.",
    endpoints: {
      auth: "/auth",
      categories: "/categories",
      transactions: "/transactions",
      budgets: "/budgets",
      insights: "/insights",
    },
  });
});

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const insightRoutes = require("./routes/insightRoutes");

// Support both /auth and /api/auth so deployment never fails regardless of path format
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.use("/categories", categoryRoutes);
app.use("/api/categories", categoryRoutes);

app.use("/transactions", transactionRoutes);
app.use("/api/transactions", transactionRoutes);

app.use("/budgets", budgetRoutes);
app.use("/api/budgets", budgetRoutes);

app.use("/insights", insightRoutes);
app.use("/api/insights", insightRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;