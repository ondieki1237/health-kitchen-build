import express from "express";
import CookingAttempt from "../../models/CookingAttempt.js";
import Recipe from "../../models/Recipe.js";
import Menu from "../../models/Menu.js";
import Notification from "../../models/Notification.js";
import { verifyToken, optionalAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = express.Router();

// Get user's cooking attempts
router.get("/", verifyToken, asyncHandler(async (req, res) => {
  const { targetId, targetType, page = 1, limit = 20 } = req.query;
  
  const filter = { user: req.userId };
  if (targetId) filter.targetId = targetId;
  if (targetType) filter.targetType = targetType;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [attempts, total] = await Promise.all([
    CookingAttempt.find(filter)
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("targetId", "name thumbnailUrl")
      .populate("user", "displayName avatar username")
      .lean(),
    CookingAttempt.countDocuments(filter)
  ]);

  res.json({
    attempts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get public cooking attempts for a recipe/menu
router.get("/public", optionalAuth, asyncHandler(async (req, res) => {
  const { targetId, targetType = "Recipe", page = 1, limit = 20 } = req.query;

  if (!targetId) {
    return res.status(400).json({ message: "targetId is required" });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [attempts, total] = await Promise.all([
    CookingAttempt.find({ targetId, targetType, isPublic: true })
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "displayName avatar username")
      .lean(),
    CookingAttempt.countDocuments({ targetId, targetType, isPublic: true })
  ]);

  res.json({
    attempts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get single cooking attempt
router.get("/:id", verifyToken, asyncHandler(async (req, res) => {
  const attempt = await CookingAttempt.findById(req.params.id)
    .populate("targetId", "name thumbnailUrl")
    .populate("user", "displayName avatar username")
    .lean();

  if (!attempt) {
    return res.status(404).json({ message: "Cooking attempt not found" });
  }

  if (attempt.user._id.toString() !== req.userId.toString() && !attempt.isPublic) {
    return res.status(403).json({ message: "Not authorized to view this attempt" });
  }

  res.json(attempt);
}));

// Create cooking attempt
router.post("/", verifyToken, asyncHandler(async (req, res) => {
  const {
    targetId,
    targetType,
    photos,
    rating,
    review,
    actualCookingTime,
    difficultyExperienced,
    modifications,
    tips,
    wouldMakeAgain,
    servedTo,
    occasion,
    estimatedCost,
    isPublic
  } = req.body;

  if (!targetId || !rating) {
    return res.status(400).json({ message: "targetId and rating are required" });
  }

  const attempt = new CookingAttempt({
    user: req.userId,
    targetId,
    targetType: targetType || "Recipe",
    photos,
    rating,
    review,
    actualCookingTime,
    difficultyExperienced,
    modifications,
    tips,
    wouldMakeAgain,
    servedTo,
    occasion,
    estimatedCost,
    isPublic: isPublic !== undefined ? isPublic : true
  });

  await attempt.save();

  // Update target stats
  const Model = targetType === "Menu" ? Menu : Recipe;
  await Model.findByIdAndUpdate(targetId, {
    $inc: { "stats.tried": 1 }
  });

  const populatedAttempt = await CookingAttempt.findById(attempt._id)
    .populate("targetId", "name thumbnailUrl")
    .populate("user", "displayName avatar username");

  res.status(201).json(populatedAttempt);
}));

// Update cooking attempt
router.put("/:id", verifyToken, asyncHandler(async (req, res) => {
  const attempt = await CookingAttempt.findById(req.params.id);

  if (!attempt) {
    return res.status(404).json({ message: "Cooking attempt not found" });
  }

  if (attempt.userId.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized to update this attempt" });
  }

  Object.assign(attempt, req.body);
  await attempt.save();

  const updatedAttempt = await CookingAttempt.findById(attempt._id)
    .populate("recipeId", "name imageUrl");

  res.json(updatedAttempt);
}));

// Delete cooking attempt
router.delete("/:id", verifyToken, asyncHandler(async (req, res) => {
  const attempt = await CookingAttempt.findById(req.params.id);

  if (!attempt) {
    return res.status(404).json({ message: "Cooking attempt not found" });
  }

  if (attempt.userId.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized to delete this attempt" });
  }

  await attempt.deleteOne();
  res.json({ message: "Cooking attempt deleted successfully" });
}));

export default router;
