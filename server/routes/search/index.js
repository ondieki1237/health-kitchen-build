import express from "express";
import Recipe from "../../models/Recipe.js";
import { optionalAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = express.Router();

// Advanced search
router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const {
    q,
    category,
    cuisine,
    isVegetarian,
    isVegan,
    minCookingTime,
    maxCookingTime,
    difficulty,
    ingredients,
    excludeIngredients,
    minRating,
    sort = "-createdAt",
    page = 1,
    limit = 20
  } = req.query;

  const filter = {};

  // Text search
  if (q) {
    filter.$text = { $search: q };
  }

  // Category and cuisine
  if (category) filter.category = category;
  if (cuisine) filter.cuisine = cuisine;

  // Dietary preferences
  if (isVegetarian === "true") filter.isVegetarian = true;
  if (isVegan === "true") filter.isVegan = true;

  // Cooking time range
  if (minCookingTime || maxCookingTime) {
    filter.cookingTimeMinutes = {};
    if (minCookingTime) filter.cookingTimeMinutes.$gte = parseInt(minCookingTime);
    if (maxCookingTime) filter.cookingTimeMinutes.$lte = parseInt(maxCookingTime);
  }

  // Difficulty
  if (difficulty) filter.difficultyLevel = difficulty;

  // Ingredients filters
  if (ingredients) {
    const ingredientList = ingredients.split(",").map(i => i.trim());
    filter["ingredients.name"] = { $all: ingredientList.map(i => new RegExp(i, "i")) };
  }

  if (excludeIngredients) {
    const excludeList = excludeIngredients.split(",").map(i => i.trim());
    filter["ingredients.name"] = { 
      ...filter["ingredients.name"],
      $nin: excludeList.map(i => new RegExp(i, "i"))
    };
  }

  // Minimum rating
  if (minRating) {
    filter.rating = { $gte: parseFloat(minRating) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [recipes, total] = await Promise.all([
    Recipe.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "displayName avatar username")
      .lean(),
    Recipe.countDocuments(filter)
  ]);

  res.json({
    recipes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get filter options (categories, cuisines, etc.)
router.get("/filters", asyncHandler(async (req, res) => {
  const [categories, cuisines, difficulties] = await Promise.all([
    Recipe.distinct("category"),
    Recipe.distinct("cuisine"),
    Recipe.distinct("difficultyLevel")
  ]);

  res.json({
    categories: categories.filter(Boolean),
    cuisines: cuisines.filter(Boolean),
    difficulties: difficulties.filter(Boolean)
  });
}));

export default router;
