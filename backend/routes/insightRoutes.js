const express = require("express");
const router = express.Router();
const insightController = require("../controllers/insightController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// AI Insight and saving tips routes (accessible directly or with token)
router.get("/", authMiddleware, insightController.getInsights);
router.get("/latest", authMiddleware, insightController.getLatestInsight);
router.post("/", authMiddleware, insightController.createInsight);

module.exports = router;
