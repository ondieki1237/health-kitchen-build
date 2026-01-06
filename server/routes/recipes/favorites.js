import express from "express";
import Recipe from "../../models/Recipe.js";
import User from "../../models/User.js";
import Notification from "../../models/Notification.js";
import { verifyToken } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = express.Router();

// Toggle favorite recipe
router.post("/:id/favorite", verifyToken, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  
  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  const user = await User.findById(req.userId);
  const recipeIdStr = recipe._id.toString();
  const isFavorited = user.savedRecipes.some(id => id.toString() === recipeIdStr);

  if (isFavorited) {
    // Remove from favorites
    user.savedRecipes = user.savedRecipes.filter(id => id.toString() !== recipeIdStr);
    await Recipe.findByIdAndUpdate(req.params.id, {
      $inc: { "stats.favorites": -1 }
    });
  } else {
    // Add to favorites
    user.savedRecipes.push(recipe._id);
    await Recipe.findByIdAndUpdate(req.params.id, {
      $inc: { "stats.favorites": 1 }
    });

    // Create notification for recipe creator
    if (recipe.createdBy && recipe.createdBy.toString() !== req.userId.toString()) {
      await Notification.create({
        recipient: recipe.createdBy,
        sender: req.userId,
        type: "like",
        targetType: "Recipe",
        targetId: recipe._id,
        message: "favorited your recipe"
      });
    }
  }

  await user.save();

  res.json({ 
    isFavorited: !isFavorited,
    favoritesCount: isFavorited ? recipe.stats.favorites - 1 : recipe.stats.favorites + 1
  });
}));

// Get user's favorite recipes
router.get("/favorites", verifyToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const user = await User.findById(req.userId).populate({
    path: "savedRecipes",
    options: {
      skip,
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    }
  });

  const total = user.savedRecipes.length;

  res.json({
    recipes: user.savedRecipes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Rate a recipe
router.post("/:id/rate", verifyToken, asyncHandler(async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  // Calculate new average rating
  const newTotalRatings = recipe.stats.totalRatings + 1;
  const newAverageRating = 
    (recipe.stats.averageRating * recipe.stats.totalRatings + rating) / newTotalRatings;

  await Recipe.findByIdAndUpdate(req.params.id, {
    $set: {
      "stats.averageRating": newAverageRating,
      "stats.totalRatings": newTotalRatings
    }
  });

  // Create notification for recipe creator
  if (recipe.createdBy && recipe.createdBy.toString() !== req.userId.toString()) {
    await Notification.create({
      recipient: recipe.createdBy,
      sender: req.userId,
      type: "rating",
      targetType: "Recipe",
      targetId: recipe._id,
      message: `rated your recipe ${rating} stars`
    });
  }

  res.json({
    averageRating: newAverageRating,
    totalRatings: newTotalRatings
  });
}));

// Increment view count
router.post("/:id/view", asyncHandler(async (req, res) => {
  await Recipe.findByIdAndUpdate(req.params.id, {
    $inc: { "stats.views": 1 }
  });

  res.json({ success: true });
}));

export default router;
