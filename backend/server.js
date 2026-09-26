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

app.use("/auth",         require("./routes/authRoutes"));
app.use("/categories",   require("./routes/categoryRoutes"));
app.use("/transactions", require("./routes/transactionRoutes"));
app.use("/budgets",      require("./routes/budgetRoutes"));
app.use("/insights",     require("./routes/insightRoutes"));

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
