import mongoose from "mongoose"

const commentSchema = new mongoose.Schema(
  {
    // Can be on recipe or menu
    targetType: { type: String, enum: ["Recipe", "Menu"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "targetType" },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },

    // User's cooking result
    userPhoto: String,
    rating: { type: Number, min: 1, max: 5 },

    // Modifications made
    modifications: String,
    cookingTips: String,

    // Engagement
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Nested replies
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    hasReplies: { type: Boolean, default: false },
    repliesCount: { type: Number, default: 0 },

    // Moderation
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    isHidden: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 })
commentSchema.index({ user: 1 })
commentSchema.index({ parentComment: 1 })

export default mongoose.models.Comment || mongoose.model("Comment", commentSchema)
