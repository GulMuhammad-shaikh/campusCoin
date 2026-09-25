const Insight = require("../models/Insight");

// @desc    Get all insights (optionally by user_id and month)
// @route   GET /api/insights
exports.getInsights = async (req, res) => {
  try {
    const userId =
      req.user?.user_id ||
      req.query.user_id ||
      req.headers["x-user-id"];

    const { month } = req.query;
    const filter = {};

    if (userId) filter.user_id = userId;
    if (month) filter.month = month;

    const insights = await Insight.find(filter)
      .populate("user_id", "name email")
      .sort({ generated_at: -1 });

    return res.status(200).json({
      success: true,
      count: insights.length,
      insights,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch insights.",
      error: error.message,
    });
  }
};

// @desc    Get the latest insight for a student
// @route   GET /api/insights/latest
exports.getLatestInsight = async (req, res) => {
  try {
    const userId =
      req.user?.user_id ||
      req.query.user_id ||
      req.headers["x-user-id"];

    const filter = {};
    if (userId) filter.user_id = userId;

    const insight = await Insight.findOne(filter).sort({ generated_at: -1 });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: "No insights found.",
      });
    }

    return res.status(200).json({
      success: true,
      insight,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve latest insight.",
      error: error.message,
    });
  }
};

// @desc    Create a new AI-generated insight and saving tip
// @route   POST /api/insights
exports.createInsight = async (req, res) => {
  try {
    const userId =
      req.user?.user_id ||
      req.body.user_id ||
      req.query.user_id ||
      req.headers["x-user-id"];

    const { month, summary_text, tip_text } = req.body;

    if (!userId || !month || !summary_text || !tip_text) {
      return res.status(400).json({
        success: false,
        message: "Please provide user_id, month, summary_text, and tip_text.",
      });
    }

    const insight = await Insight.create({
      user_id: userId,
      month,
      summary_text,
      tip_text,
    });

    return res.status(201).json({
      success: true,
      message: "Insight recorded successfully.",
      insight,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save insight.",
      error: error.message,
    });
  }
};
