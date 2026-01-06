import mongoose from "mongoose"

const cookingAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Can track attempts for recipes or full menus
    targetType: { type: String, enum: ["Recipe", "Menu"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "targetType" },

    // User's experience
    photos: [String],
    rating: { type: Number, min: 1, max: 5, required: true },
    review: String,

    // Cooking details
    actualCookingTime: Number,
    difficultyExperienced: { type: String, enum: ["Easy", "Medium", "Hard"] },
    modifications: String,
    tips: String,

    // Success indicators
    wouldMakeAgain: { type: Boolean, default: true },
    servedTo: Number,
    occasion: String,

    // Cost tracking (optional)
    estimatedCost: Number,

    // Engagement
    likes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },

    // Visibility
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
)

cookingAttemptSchema.index({ user: 1, createdAt: -1 })
cookingAttemptSchema.index({ targetType: 1, targetId: 1, rating: -1 })

export default mongoose.models.CookingAttempt || mongoose.model("CookingAttempt", cookingAttemptSchema)
