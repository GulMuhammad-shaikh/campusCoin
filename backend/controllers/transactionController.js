const Transaction = require("../models/Transaction");
const Category = require("../models/Category");

// @desc    Get transactions (supports token OR direct ?user_id= query)
// @route   GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const userId =
      req.user?.user_id ||
      req.query.user_id ||
      req.headers["x-user-id"];

    const { type, startDate, endDate, category_id } = req.query;
    const filter = {};

    if (userId) {
      filter.user_id = userId;
    }

    if (type) {
      filter.type = type.toLowerCase();
    }

    if (category_id) {
      filter.category_id = category_id;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate("category_id", "name type")
      .populate("user_id", "name email")
      .sort({ date: -1, created_at: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transactions.",
      error: error.message,
    });
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("category_id", "name type")
      .populate("user_id", "name email");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transaction.",
      error: error.message,
    });
  }
};

// @desc    Create a new transaction (income or expense)
// @route   POST /api/transactions
exports.createTransaction = async (req, res) => {
  try {
    const userId =
      req.user?.user_id ||
      req.body.user_id ||
      req.query.user_id ||
      req.headers["x-user-id"];

    const {
      category_id,
      amount,
      type,
      description,
      ai_suggested_category,
      date,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required (pass via token or user_id in body/query).",
      });
    }

    if (!amount || !type) {
      return res.status(400).json({
        success: false,
        message: "Please provide amount and type ('income' or 'expense').",
      });
    }

    const transaction = await Transaction.create({
      user_id: userId,
      category_id: category_id || null,
      amount: Number(amount),
      type: type.toLowerCase(),
      description: description || "",
      ai_suggested_category: ai_suggested_category || null,
      date: date ? new Date(date) : new Date(),
    });

    const populated = await Transaction.findById(transaction._id)
      .populate("category_id", "name type")
      .populate("user_id", "name email");

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully.",
      transaction: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create transaction.",
      error: error.message,
    });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
exports.updateTransaction = async (req, res) => {
  try {
    const { amount, type, description, category_id, date, ai_suggested_category } = req.body;

    const updateData = {};
    if (amount !== undefined) updateData.amount = Number(amount);
    if (type !== undefined) updateData.type = type.toLowerCase();
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (date !== undefined) updateData.date = new Date(date);
    if (ai_suggested_category !== undefined)
      updateData.ai_suggested_category = ai_suggested_category;

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("category_id", "name type")
      .populate("user_id", "name email");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully.",
      transaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update transaction.",
      error: error.message,
    });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    await transaction.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete transaction.",
      error: error.message,
    });
  }
};

// @desc    Get summary totals (Income, Expense, Balance)
// @route   GET /api/transactions/summary
exports.getSummary = async (req, res) => {
  try {
    const userId =
      req.user?.user_id ||
      req.query.user_id ||
      req.headers["x-user-id"];

    const filter = {};
    if (userId) {
      filter.user_id = userId;
    }

    const transactions = await Transaction.find(filter);

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === "income") {
        totalIncome += Number(tx.amount || 0);
      } else if (tx.type === "expense") {
        totalExpense += Number(tx.amount || 0);
      }
    });

    const balance = totalIncome - totalExpense;

    return res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        balance,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to compute financial summary.",
      error: error.message,
    });
  }
};
