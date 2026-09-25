const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ["income", "expense"],
        message: "Category type must be either 'income' or 'expense'",
      },
      required: [true, "Category type is required"],
    },
    is_default: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.category_id = ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.category_id = ret._id;
        return ret;
      },
    },
  }
);

// Virtual alias: category_id points to _id
categorySchema.virtual("category_id").get(function () {
  return this._id;
});

module.exports = mongoose.model("Category", categorySchema);
