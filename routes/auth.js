import express from "express"
import jwt from "jsonwebtoken"
import { body, validationResult } from "express-validator"
import User from "../models/User.js"

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"

// Signup
router.post(
  "/signup",
  [
    body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { username, email, password } = req.body

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      })

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Create new user
      const user = new User({
        username,
        email,
        passwordHash: password,
      })

      await user.save()

      // Generate JWT
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" })

      res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
        },
      })
    } catch (error) {
      console.error("Signup error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Login
router.post("/login", [body("email").isEmail(), body("password").exists()], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" })

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        dietaryPreferences: user.dietaryPreferences,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get current user (protected route)
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-passwordHash")

    res.json(user)
  } catch (error) {
    res.status(401).json({ message: "Invalid token" })
  }
})

export default router
