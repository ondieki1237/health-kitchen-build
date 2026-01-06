import mongoose from "mongoose"

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    description: String,
    coverImage: String,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Menu type
    type: {
      type: String,
      enum: ["daily", "weekly", "special-occasion", "meal-prep", "budget", "quick"],
      default: "daily",
    },

    // Recipes organized by meal times
    meals: [
      {
        mealTime: {
          type: String,
          enum: ["breakfast", "lunch", "dinner", "snack", "dessert"],
          required: true,
        },
        recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
        servings: Number,
        notes: String,
        day: { type: Number, min: 1, max: 7 },
      },
    ],

    // Menu metadata
    totalCookingTime: Number,
    estimatedCost: Number,
    servesCount: Number,
    tags: [String],

    // Social features
    stats: {
      views: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
      tried: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
    },

    isPublic: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

menuSchema.index({ name: "text", description: "text", tags: "text" })

export default mongoose.models.Menu || mongoose.model("Menu", menuSchema)
