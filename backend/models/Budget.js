const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user_id is required"],
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "category_id is required"],
    },
    month: {
      type: String, // Stored as "YYYY-MM" or ISO date string for easy monthly queries
      required: [true, "Month is required (e.g. 2026-09)"],
      trim: true,
    },
    limit_amount: {
      type: Number,
      required: [true, "limit_amount is required"],
      min: [0, "Limit amount cannot be negative"],
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.budget_id = ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.budget_id = ret._id;
        return ret;
      },
    },
  }
);

// Virtual alias: budget_id points to _id
budgetSchema.virtual("budget_id").get(function () {
  return this._id;
});

module.exports = mongoose.model("Budget", budgetSchema);
