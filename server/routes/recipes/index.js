import express from "express";
import Recipe from "../../models/Recipe.js";
import User from "../../models/User.js";
import Notification from "../../models/Notification.js";
import { verifyToken, optionalAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import favoritesRouter from "./favorites.js";

const router = express.Router();

// Mount favorites routes
router.use("/", favoritesRouter);

// Get all recipes with filters and pagination
router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const {
    category,
    cuisine,
    isVegetarian,
    isVegan,
    search,
    page = 1,
    limit = 20,
    sort = "-createdAt"
  } = req.query;

  const filter = {};

  if (category) filter.category = category;
  if (cuisine) filter.cuisine = cuisine;
  if (isVegetarian === "true") filter.isVegetarian = true;
  if (isVegan === "true") filter.isVegan = true;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
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

// Get single recipe
router.get("/:id", optionalAuth, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id)
    .populate("createdBy", "displayName avatar username")
    .lean();

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  // Check if user has liked this recipe
  if (req.userId) {
    recipe.isLiked = recipe.likedBy?.some(id => id.toString() === req.userId.toString());
  }

  res.json(recipe);
}));

// Create recipe
router.post("/", verifyToken, asyncHandler(async (req, res) => {
  // Generate slug if not provided
  let slug = req.body.slug;
  if (!slug && req.body.name) {
    slug = req.body.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with -
      .replace(/^-+|-+$/g, ''); // Trim -

    // Append random string to ensure uniqueness
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const recipeData = {
    ...req.body,
    slug: slug,
    createdBy: req.userId,
    dataSource: 'user' // Ensure it's marked as user-generated
  };

  const recipe = new Recipe(recipeData);
  await recipe.save();

  const populatedRecipe = await Recipe.findById(recipe._id)
    .populate("createdBy", "displayName avatar username");

  res.status(201).json(populatedRecipe);
}));

// Update recipe
router.put("/:id", verifyToken, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  // Check ownership or allow image update
  console.log(`[RecipeUpdate] Updating ${req.params.id} by User ${req.userId}`);
  console.log(`[RecipeUpdate] Recipe CreatedBy: ${recipe.createdBy}, Body Keys: ${Object.keys(req.body)}`);

  if (!req.userId) {
    console.error("[RecipeUpdate] Missing req.userId!");
    return res.status(401).json({ message: "User not authenticated" });
  }

  const recipeCreatorId = recipe.createdBy ? recipe.createdBy.toString() : null;
  const currentUserId = req.userId.toString();

  const isCreator = recipeCreatorId && recipeCreatorId === currentUserId;
  // Check if only imageUrl is being updated (ignoring potentially empty fields if any, but strict check is safer)
  const isImageOnlyUpdate = Object.keys(req.body).length === 1 && req.body.imageUrl;

  if (!isCreator && !isImageOnlyUpdate) {
    console.log("[RecipeUpdate] Authorization failed");
    return res.status(403).json({ message: "Not authorized to update this recipe" });
  }

  Object.assign(recipe, req.body);
  await recipe.save();

  const updatedRecipe = await Recipe.findById(recipe._id)
    .populate("createdBy", "displayName avatar username");

  res.json(updatedRecipe);
}));

// Delete recipe
router.delete("/:id", verifyToken, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  // Check ownership
  if (recipe.createdBy.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized to delete this recipe" });
  }

  await recipe.deleteOne();
  res.json({ message: "Recipe deleted successfully" });
}));

// Like/Unlike recipe
router.post("/:id/like", verifyToken, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  const userIdStr = req.userId.toString();
  const likedByIndex = recipe.likedBy.findIndex(id => id.toString() === userIdStr);

  if (likedByIndex > -1) {
    // Unlike
    recipe.likedBy.splice(likedByIndex, 1);
    recipe.likes = Math.max(0, recipe.likes - 1);
  } else {
    // Like
    recipe.likedBy.push(req.userId);
    recipe.likes++;
  }

  await recipe.save();

  res.json({
    likes: recipe.likes,
    isLiked: likedByIndex === -1
  });
}));

// Save/Unsave recipe
router.post("/:id/save", verifyToken, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  }

  const userIdStr = req.userId.toString();
  const savedByIndex = recipe.savedBy.findIndex(id => id.toString() === userIdStr);

  if (savedByIndex > -1) {
    // Unsave
    recipe.savedBy.splice(savedByIndex, 1);
    recipe.saves = Math.max(0, recipe.saves - 1);
  } else {
    // Save
    recipe.savedBy.push(req.userId);
    recipe.saves++;
  }

  await recipe.save();

  res.json({
    saves: recipe.saves,
    isSaved: savedByIndex === -1
  });
}));

export default router;
