const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Category routes (can be accessed directly or with token)
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategoryById);
router.post("/", authMiddleware, categoryController.createCategory);
router.delete("/:id", authMiddleware, categoryController.deleteCategory);

module.exports = router;
