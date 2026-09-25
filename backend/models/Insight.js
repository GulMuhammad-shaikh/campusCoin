const mongoose = require("mongoose");

const insightSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user_id is required"],
    },
    month: {
      type: String, // e.g. "2026-09"
      required: [true, "Month is required"],
      trim: true,
    },
    summary_text: {
      type: String,
      required: [true, "summary_text is required"],
    },
    tip_text: {
      type: String,
      required: [true, "tip_text is required"],
    },
    generated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.insight_id = ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.insight_id = ret._id;
        return ret;
      },
    },
  }
);

// Virtual alias: insight_id points to _id
insightSchema.virtual("insight_id").get(function () {
  return this._id;
});

module.exports = mongoose.model("Insight", insightSchema);
