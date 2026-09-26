const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
  return jwt.sign(
    { user_id: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET || "campus_coin_jwt_secret_key_2026",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, academic_year, monthly_savings_goal } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide name, email, and password." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash,
      academic_year: academic_year || "",
      monthly_savings_goal: monthly_savings_goal ? Number(monthly_savings_goal) : 0,
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Student registered successfully.",
      token,
      user: {
        user_id: user._id,
        name: user.name,
        email: user.email,
        academic_year: user.academic_year,
        monthly_savings_goal: user.monthly_savings_goal,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Registration failed.", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        user_id: user._id,
        name: user.name,
        email: user.email,
        academic_year: user.academic_year,
        monthly_savings_goal: user.monthly_savings_goal,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Login failed.", error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user?.user_id || req.query.user_id;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    const user = await User.findById(userId).select("-password_hash");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve profile.", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user?.user_id || req.body.user_id || req.query.user_id;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    const { name, academic_year, monthly_savings_goal } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (academic_year !== undefined) updateData.academic_year = academic_year;
    if (monthly_savings_goal !== undefined) updateData.monthly_savings_goal = Number(monthly_savings_goal);

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select("-password_hash");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, message: "Profile updated successfully.", user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update profile.", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password_hash").sort({ created_at: -1 });
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch users.", error: error.message });
  }
};
