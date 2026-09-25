const Category = require("../models/Category");

// @desc    Get all categories (optionally filter by type: ?type=income or ?type=expense)
// @route   GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};

    if (type) {
      filter.type = type.toLowerCase();
    }

    const categories = await Category.find(filter).sort({ type: 1, name: 1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
      error: error.message,
    });
  }
};

// @desc    Get single category by id
// @route   GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category.",
      error: error.message,
    });
  }
};

// @desc    Create a new category
// @route   POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, type, is_default } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Please provide category name and type ('income' or 'expense').",
      });
    }

    const category = await Category.create({
      name,
      type: type.toLowerCase(),
      is_default: is_default !== undefined ? Boolean(is_default) : false,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create category.",
      error: error.message,
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    await category.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete category.",
      error: error.message,
    });
  }
};
