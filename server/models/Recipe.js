import mongoose from "mongoose"

const recipeSchema = new mongoose.Schema(
  {
    mealDbId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, index: true },
    slug: { type: String, unique: true, required: true },
    category: { type: String, index: true },
    cuisine: { type: String, index: true },
    area: String,
    isVegan: { type: Boolean, default: false, index: true },
    isVegetarian: { type: Boolean, default: true, index: true },
    thumbnailUrl: String,
    videoUrl: String,
    sourceUrl: String,
    description: String,
    cookingTimeMinutes: Number,
    servingSize: { type: Number, default: 4 },
    difficultyLevel: { type: String, enum: ["Easy", "Medium", "Hard"] },
    caloriesPerServing: Number,
    dataSource: { type: String, default: "manual", enum: ["themealdb", "manual", "imported", "user"] },

    // User who created (for user-generated recipes)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Ingredients with measurements
    ingredients: [
      {
        name: { type: String, required: true },
        quantity: String,
        measurementUnit: String,
        notes: String,
      },
    ],

    // Cooking instructions
    instructions: [
      {
        stepNumber: Number,
        instruction: { type: String, required: true },
        timeMinutes: Number,
      },
    ],

    // Tags for filtering
    tags: [{ type: String, index: true }],

    // Social features
    stats: {
      views: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
      tried: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
    },

    // Nutrition (optional detailed breakdown)
    nutrition: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sugar: Number,
      sodium: Number,
    },
  },
  {
    timestamps: true,
  }
)

// Text search index
recipeSchema.index({ name: "text", description: "text", tags: "text" })

export default mongoose.model("Recipe", recipeSchema)
