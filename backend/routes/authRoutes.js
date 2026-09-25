const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Public authentication routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Profile routes (accessible with JWT or directly with ?user_id= or /:id)
router.get("/profile", authMiddleware, authController.getProfile);
router.get("/profile/:id", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/profile/:id", authMiddleware, authController.updateProfile);

// Testing / listing users
router.get("/users", authController.getAllUsers);

module.exports = router;
