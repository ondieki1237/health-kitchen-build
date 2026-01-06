import express from "express";
import User from "../../models/User.js";
import Recipe from "../../models/Recipe.js";
import { verifyToken } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = express.Router();

// Get current user profile
router.get("/me", verifyToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId)
    .select("-passwordHash")
    .lean();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
}));

// Update user profile
router.put("/me", verifyToken, asyncHandler(async (req, res) => {
  const allowedUpdates = [
    "displayName",
    "bio",
    "avatar",
    "dietaryPreferences",
    "allergens",
    "location",
    "website"
  ];

  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-passwordHash");

  res.json(user);
}));

// Get public user profile
router.get("/:username", asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .select("username displayName bio avatar location website stats createdAt")
    .lean();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Get user's public recipes
  const recipes = await Recipe.find({ createdBy: user._id })
    .sort("-createdAt")
    .limit(10)
    .select("name imageUrl likes saves cookingTimeMinutes")
    .lean();

  res.json({ user, recipes });
}));

// Follow/Unfollow user
router.post("/:userId/follow", verifyToken, asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;

  if (targetUserId === req.userId.toString()) {
    return res.status(400).json({ message: "Cannot follow yourself" });
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(req.userId),
    User.findById(targetUserId)
  ]);

  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const isFollowing = currentUser.following.some(id => id.toString() === targetUserId);

  if (isFollowing) {
    // Unfollow
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.userId.toString());
    currentUser.stats.following = Math.max(0, currentUser.stats.following - 1);
    targetUser.stats.followers = Math.max(0, targetUser.stats.followers - 1);
  } else {
    // Follow
    currentUser.following.push(targetUserId);
    targetUser.followers.push(req.userId);
    currentUser.stats.following++;
    targetUser.stats.followers++;
  }

  await Promise.all([currentUser.save(), targetUser.save()]);

  res.json({ 
    isFollowing: !isFollowing,
    followersCount: targetUser.stats.followers 
  });
}));

// Get user's saved recipes
router.get("/me/saved", verifyToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [recipes, total] = await Promise.all([
    Recipe.find({ savedBy: req.userId })
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "displayName avatar username")
      .lean(),
    Recipe.countDocuments({ savedBy: req.userId })
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

export default router;
