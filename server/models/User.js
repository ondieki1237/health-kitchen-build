import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  displayName: String,
  avatar: { type: String, default: null },
  bio: String,
  location: String,

  // Dietary preferences
  dietaryPreferences: {
    isVegan: { type: Boolean, default: false },
    isVegetarian: { type: Boolean, default: true },
    allergies: [String],
    dislikedIngredients: [String],
  },

  // Social stats
  stats: {
    recipesCreated: { type: Number, default: 0 },
    menusCreated: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
  },

  // Saved recipes and menus
  savedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
  savedMenus: [{ type: mongoose.Schema.Types.ObjectId, ref: "Menu" }],

  // Achievements
  badges: [
    {
      name: String,
      icon: String,
      earnedAt: Date,
    },
  ],

  isVerified: { type: Boolean, default: false },
  lastLoginAt: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (passwordToCheck) {
  return bcrypt.compare(passwordToCheck, this.passwordHash)
}

export default mongoose.model("User", userSchema)
