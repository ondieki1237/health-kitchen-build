import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    type: {
      type: String,
      enum: [
        "comment",
        "reply",
        "like",
        "follow",
        "mention",
        "recipe-featured",
        "menu-featured",
        "badge-earned",
        "cooking-milestone",
      ],
      required: true,
    },

    // Reference to related content
    targetType: { type: String, enum: ["Recipe", "Menu", "Comment", "User"] },
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: "targetType" },

    message: { type: String, required: true },
    image: String,

    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  {
    timestamps: true,
  }
)

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema)
