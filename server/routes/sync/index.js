import express from "express";
import { syncMealsByArea, syncMealsByCategory } from "../../lib/themealdb.js";
import { verifyToken } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = express.Router();

// Sync recipes from TheMealDB by area
router.post("/themealdb/area", verifyToken, asyncHandler(async (req, res) => {
  const { area } = req.body;

  if (!area) {
    return res.status(400).json({ message: "Area is required" });
  }

  const result = await syncMealsByArea(area);
  res.json(result);
}));

// Sync recipes from TheMealDB by category
router.post("/themealdb/category", verifyToken, asyncHandler(async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ message: "Category is required" });
  }

  const result = await syncMealsByCategory(category);
  res.json(result);
}));

// Get available areas and categories
router.get("/themealdb/options", asyncHandler(async (req, res) => {
  res.json({
    areas: [
      "American", "British", "Canadian", "Chinese", "Croatian", "Dutch",
      "Egyptian", "Filipino", "French", "Greek", "Indian", "Irish",
      "Italian", "Jamaican", "Japanese", "Kenyan", "Malaysian", "Mexican",
      "Moroccan", "Polish", "Portuguese", "Russian", "Spanish", "Thai",
      "Tunisian", "Turkish", "Ukrainian", "Vietnamese"
    ],
    categories: [
      "Beef", "Breakfast", "Chicken", "Dessert", "Goat", "Lamb",
      "Miscellaneous", "Pasta", "Pork", "Seafood", "Side", "Starter",
      "Vegan", "Vegetarian"
    ]
  });
}));

export default router;
