const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user_id is required"],
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: {
        values: ["income", "expense"],
        message: "Transaction type must be 'income' or 'expense'",
      },
      required: [true, "Transaction type is required"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    ai_suggested_category: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.transaction_id = ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.transaction_id = ret._id;
        return ret;
      },
    },
  }
);

// Virtual alias: transaction_id points to _id
transactionSchema.virtual("transaction_id").get(function () {
  return this._id;
});

module.exports = mongoose.model("Transaction", transactionSchema);
