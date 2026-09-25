const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: [true, "Password is required"],
    },
    academic_year: {
      type: String,
      default: "",
      trim: true,
    },
    monthly_savings_goal: {
      type: Number,
      default: 0.0,
      min: [0, "Savings goal cannot be negative"],
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
        ret.user_id = ret._id;
        delete ret.password_hash; // Don't expose password hash in normal output
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.user_id = ret._id;
        return ret;
      },
    },
  }
);

// Virtual alias: user_id points to _id
userSchema.virtual("user_id").get(function () {
  return this._id;
});

module.exports = mongoose.model("User", userSchema);
