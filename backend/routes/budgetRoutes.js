const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.get("/",    authMiddleware, budgetController.getBudgets);
router.post("/",   authMiddleware, budgetController.setBudget);
router.delete("/:id", authMiddleware, budgetController.deleteBudget);

module.exports = router;
