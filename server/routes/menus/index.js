import express from "express";
import Menu from "../../models/Menu.js";
import { verifyToken, optionalAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = express.Router();

// Get all menus
router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, userId } = req.query;
  const filter = userId ? { createdBy: userId } : {};

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [menus, total] = await Promise.all([
    Menu.find(filter)
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "displayName avatar username")
      .populate("recipes", "name imageUrl cookingTimeMinutes servingSize")
      .lean(),
    Menu.countDocuments(filter)
  ]);

  res.json({
    menus,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get current weekly menu for user
router.get("/weekly", verifyToken, asyncHandler(async (req, res) => {
  let menu = await Menu.findOne({
    createdBy: req.userId,
    type: "weekly"
  })
    .sort("-updatedAt") // Get the most recently active/updated one
    .populate("meals.recipe", "name caloriesPerServing nutrition");

  if (!menu) {
    // Return empty structure if no plan exists yet
    return res.json({ meals: [] });
  }

  res.json(menu);
}));

// Save/Update weekly menu
router.post("/weekly", verifyToken, asyncHandler(async (req, res) => {
  const { meals } = req.body; // Expecting array of { day, mealTime, recipe, servings }

  // Check if user already has a weekly menu
  let menu = await Menu.findOne({
    createdBy: req.userId,
    type: "weekly"
  }).sort("-updatedAt");

  if (menu) {
    // Update existing
    menu.meals = meals;
    menu.updatedAt = new Date();
    await menu.save();
  } else {
    // Create new
    menu = new Menu({
      name: "My Weekly Plan",
      slug: `weekly-plan-${req.userId}-${Date.now()}`,
      createdBy: req.userId,
      type: "weekly",
      meals: meals,
      isPublic: false
    });
    await menu.save();
  }

  res.json(menu);
}));

// Get single menu
router.get("/:id", optionalAuth, asyncHandler(async (req, res) => {
  const menu = await Menu.findById(req.params.id)
    .populate("createdBy", "displayName avatar username")
    .populate("recipes")
    .lean();

  if (!menu) {
    return res.status(404).json({ message: "Menu not found" });
  }

  res.json(menu);
}));

// Create menu
router.post("/", verifyToken, asyncHandler(async (req, res) => {
  const menuData = {
    ...req.body,
    createdBy: req.userId,
  };

  const menu = new Menu(menuData);
  await menu.save();

  const populatedMenu = await Menu.findById(menu._id)
    .populate("createdBy", "displayName avatar username")
    .populate("recipes");

  res.status(201).json(populatedMenu);
}));

// Update menu
router.put("/:id", verifyToken, asyncHandler(async (req, res) => {
  const menu = await Menu.findById(req.params.id);

  if (!menu) {
    return res.status(404).json({ message: "Menu not found" });
  }

  if (menu.createdBy.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized to update this menu" });
  }

  Object.assign(menu, req.body);
  await menu.save();

  const updatedMenu = await Menu.findById(menu._id)
    .populate("createdBy", "displayName avatar username")
    .populate("recipes");

  res.json(updatedMenu);
}));

// Delete menu
router.delete("/:id", verifyToken, asyncHandler(async (req, res) => {
  const menu = await Menu.findById(req.params.id);

  if (!menu) {
    return res.status(404).json({ message: "Menu not found" });
  }

  if (menu.createdBy.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized to delete this menu" });
  }

  await menu.deleteOne();
  res.json({ message: "Menu deleted successfully" });
}));

export default router;
