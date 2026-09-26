const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.query.user_id || req.headers["x-user-id"];
    const { type, startDate, endDate, category_id, category_name, month } = req.query;
    const filter = {};

    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        filter.user_id = userId;
      } else {
        return res.status(200).json({ success: true, count: 0, transactions: [] });
      }
    }

    if (type) filter.type = type.toLowerCase();
    if (category_id) filter.category_id = category_id;

    if (category_name) {
      const cat = await Category.findOne({ name: category_name });
      if (cat) filter.category_id = cat._id;
    }

    if (month) {
      const [year, m] = month.split("-").map(Number);
      filter.date = { $gte: new Date(year, m - 1, 1), $lte: new Date(year, m, 0, 23, 59, 59, 999) };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        filter.date.$lte = endD;
      }
    }

    const transactions = await Transaction.find(filter)
      .populate("category_id", "name type")
      .populate("user_id", "name email")
      .sort({ date: -1, created_at: -1 });

    return res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve transactions.", error: error.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("category_id", "name type")
      .populate("user_id", "name email");

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    return res.status(200).json({ success: true, transaction });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve transaction.", error: error.message });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.body.user_id || req.query.user_id || req.headers["x-user-id"];
    const { category_id, amount, type, description, ai_suggested_category, date } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Valid User ID is required." });
    }
    if (!amount || !type) {
      return res.status(400).json({ success: false, message: "Please provide amount and type." });
    }

    let resolvedCategoryId = null;
    const catInput = category_id || req.body.category;
    if (catInput) {
      if (mongoose.Types.ObjectId.isValid(catInput)) {
        resolvedCategoryId = catInput;
      } else {
        const catName = String(catInput).trim();
        let cat = await Category.findOne({ name: new RegExp(`^${catName}$`, "i") });
        if (!cat) cat = await Category.create({ name: catName, type: type.toLowerCase(), is_default: false });
        resolvedCategoryId = cat._id;
      }
    }

    const transaction = await Transaction.create({
      user_id: userId,
      category_id: resolvedCategoryId,
      amount: Number(amount),
      type: type.toLowerCase(),
      description: description || "",
      ai_suggested_category: ai_suggested_category || null,
      date: date ? new Date(date) : new Date(),
    });

    const populated = await Transaction.findById(transaction._id)
      .populate("category_id", "name type")
      .populate("user_id", "name email");

    return res.status(201).json({ success: true, message: "Transaction created successfully.", transaction: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create transaction.", error: error.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    const { amount, type, description, category_id, date, ai_suggested_category } = req.body;
    const updateData = {};

    if (amount !== undefined) updateData.amount = Number(amount);
    if (type !== undefined) updateData.type = type.toLowerCase();
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (ai_suggested_category !== undefined) updateData.ai_suggested_category = ai_suggested_category;

    const catInput = category_id || req.body.category;
    if (catInput !== undefined) {
      if (mongoose.Types.ObjectId.isValid(catInput)) {
        updateData.category_id = catInput;
      } else if (catInput) {
        const catName = String(catInput).trim();
        let cat = await Category.findOne({ name: new RegExp(`^${catName}$`, "i") });
        if (!cat) cat = await Category.create({ name: catName, type: (type || "expense").toLowerCase(), is_default: false });
        updateData.category_id = cat._id;
      }
    }

    const transaction = await Transaction.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate("category_id", "name type")
      .populate("user_id", "name email");

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    return res.status(200).json({ success: true, message: "Transaction updated.", transaction });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update transaction.", error: error.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    await transaction.deleteOne();
    return res.status(200).json({ success: true, message: "Transaction deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete transaction.", error: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.query.user_id || req.headers["x-user-id"];
    const filter = {};

    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        filter.user_id = userId;
      } else {
        return res.status(200).json({ success: true, summary: { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 } });
      }
    }

    const transactions = await Transaction.find(filter);
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === "income") totalIncome += Number(tx.amount || 0);
      else if (tx.type === "expense") totalExpense += Number(tx.amount || 0);
    });

    return res.status(200).json({
      success: true,
      summary: { totalIncome, totalExpense, balance: totalIncome - totalExpense, transactionCount: transactions.length },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to compute summary.", error: error.message });
  }
};
