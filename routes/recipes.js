import express from "express"
import Recipe from "../models/Recipe.js"
import jwt from "jsonwebtoken"

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid token" })
  }
}

// Get all recipes with filters
router.get("/", async (req, res) => {
  try {
    const { category, cuisine, isVegetarian, isVegan, search } = req.query
    const filter = {}

    if (category) filter.category = category
    if (cuisine) filter.cuisine = cuisine
    if (isVegetarian === "true") filter.isVegetarian = true
    if (isVegan === "true") filter.isVegan = true
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const recipes = await Recipe.find(filter).limit(50)
    res.json(recipes)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Get single recipe
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate("createdBy", "displayName avatar")
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" })
    }
    res.json(recipe)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Create recipe (protected)
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      cuisine,
      ingredients,
      instructions,
      cookingTimeMinutes,
      servingSize,
      difficultyLevel,
      isVegetarian,
      isVegan,
      imageUrl,
    } = req.body

    const recipe = new Recipe({
      name,
      description,
      category,
      cuisine,
      ingredients,
      instructions,
      cookingTimeMinutes,
      servingSize,
      difficultyLevel,
      isVegetarian,
      isVegan,
      imageUrl,
      createdBy: req.userId,
    })

    await recipe.save()
    res.status(201).json(recipe)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Like recipe (protected)
router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" })
    }

    if (recipe.likedBy.includes(req.userId)) {
      recipe.likedBy = recipe.likedBy.filter((id) => !id.equals(req.userId))
      recipe.likes--
    } else {
      recipe.likedBy.push(req.userId)
      recipe.likes++
    }

    await recipe.save()
    res.json(recipe)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

export default router
