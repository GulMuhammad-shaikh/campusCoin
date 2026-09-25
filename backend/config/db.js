const mongoose = require("mongoose");
const Category = require("../models/Category");

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campus_coin_db";

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed default categories if none exist
    await seedDefaultCategories();
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    console.log(
      "Tip: Make sure MongoDB is running or check your MONGO_URI in .env"
    );
  }
};

/**
 * Seed standard default categories for student finances
 */
async function seedDefaultCategories() {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      const defaultCategories = [
        { name: "Food & Dining", type: "expense", is_default: true },
        { name: "Transport", type: "expense", is_default: true },
        { name: "Hostel & Rent", type: "expense", is_default: true },
        { name: "Academics & Books", type: "expense", is_default: true },
        { name: "Entertainment", type: "expense", is_default: true },
        { name: "Utilities & Internet", type: "expense", is_default: true },
        { name: "Personal Care", type: "expense", is_default: true },
        { name: "Pocket Money / Allowance", type: "income", is_default: true },
        { name: "Part-time Job / Salary", type: "income", is_default: true },
        { name: "Scholarship", type: "income", is_default: true },
        { name: "Freelance", type: "income", is_default: true },
        { name: "Other Income", type: "income", is_default: true },
      ];

      await Category.insertMany(defaultCategories);
      console.log("Default categories seeded successfully into MongoDB.");
    }
  } catch (err) {
    console.error("Error seeding default categories:", err.message);
  }
}

module.exports = connectDB;
