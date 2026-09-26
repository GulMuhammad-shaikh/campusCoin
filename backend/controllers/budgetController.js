const mongoose = require("mongoose");
const Budget = require("../models/Budget");

// @desc    Get all budgets (optionally by user_id and month)
// @route   GET /api/budgets
exports.getBudgets = async (req, res) => {
  try {
    const userId =
      req.user?.user_id ||
      req.query.user_id ||
      req.headers["x-user-id"];

    const { month } = req.query;
    const filter = {};

    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        filter.user_id = userId;
      } else {
        return res.status(200).json({ success: true, count: 0, budgets: [] });
      }
    }
    if (month) filter.month = month; // e.g. "2026-09"

    const budgets = await Budget.find(filter)
      .populate("category_id", "name type")
      .populate("user_id", "name email");

    return res.status(200).json({
      success: true,
      count: budgets.length,
      budgets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch budgets.",
      error: error.message,
    });
  }
};

// @desc    Create or update budget cap for a category and month
// @route   POST /api/budgets
exports.setBudget = async (req, res) => {
  try {
    const userId =
      req.user?.user_id ||
      req.body.user_id ||
      req.query.user_id ||
      req.headers["x-user-id"];

    const { category_id, month, limit_amount } = req.body;

    if (!userId || !category_id || !month || limit_amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide user_id, category_id, month (YYYY-MM), and limit_amount.",
      });
    }

    // Upsert budget: update if existing for same user, category, and month, else create
    const budget = await Budget.findOneAndUpdate(
      { user_id: userId, category_id, month },
      { limit_amount: Number(limit_amount) },
      { new: true, upsert: true, runValidators: true }
    ).populate("category_id", "name type");

    return res.status(200).json({
      success: true,
      message: "Budget saved successfully.",
      budget,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save budget.",
      error: error.message,
    });
  }
};

// @desc    Delete a budget entry
// @route   DELETE /api/budgets/:id
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found.",
      });
    }

    await budget.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Budget deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete budget.",
      error: error.message,
    });
  }
};
