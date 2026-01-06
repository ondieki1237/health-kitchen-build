import express from "express";
import CookingAttempt from "../../models/CookingAttempt.js";
import { verifyToken } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = express.Router();

// Get user's cooking attempts
router.get("/", verifyToken, asyncHandler(async (req, res) => {
  const { recipeId, page = 1, limit = 20 } = req.query;
  
  const filter = { userId: req.userId };
  if (recipeId) filter.recipeId = recipeId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [attempts, total] = await Promise.all([
    CookingAttempt.find(filter)
      .sort("-attemptDate")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("recipeId", "name imageUrl")
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

// Get single cooking attempt
router.get("/:id", verifyToken, asyncHandler(async (req, res) => {
  const attempt = await CookingAttempt.findById(req.params.id)
    .populate("recipeId", "name imageUrl")
    .lean();

  if (!attempt) {
    return res.status(404).json({ message: "Cooking attempt not found" });
  }

  if (attempt.userId.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized to view this attempt" });
  }

  res.json(attempt);
}));

// Create cooking attempt
router.post("/", verifyToken, asyncHandler(async (req, res) => {
  const attemptData = {
    ...req.body,
    userId: req.userId,
  };

  const attempt = new CookingAttempt(attemptData);
  await attempt.save();

  const populatedAttempt = await CookingAttempt.findById(attempt._id)
    .populate("recipeId", "name imageUrl");

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
