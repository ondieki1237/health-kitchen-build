import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/server/lib/db"
import Comment from "@/server/models/Comment"
import { verifyToken, getAuthHeader } from "@/server/lib/auth"

// PUT update comment
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const token = await getAuthHeader()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const comment = await Comment.findById(params.id)
    if (!comment) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 })
    }

    // Check ownership
    if (comment.user.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { content, modifications, cookingTips } = await request.json()

    const updatedComment = await Comment.findByIdAndUpdate(
      params.id,
      {
        content,
        modifications,
        cookingTips,
        isEdited: true,
        editedAt: new Date(),
      },
      { new: true }
    ).populate("user", "username displayName avatar")

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error("Comment update error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// DELETE comment
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const token = await getAuthHeader()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const comment = await Comment.findById(params.id)
    if (!comment) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 })
    }

    // Check ownership
    if (comment.user.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await Comment.findByIdAndDelete(params.id)

    // Update parent comment if reply
    if (comment.parentComment) {
      const parentRepliesCount = await Comment.countDocuments({ parentComment: comment.parentComment })
      await Comment.findByIdAndUpdate(comment.parentComment, {
        repliesCount: parentRepliesCount,
        hasReplies: parentRepliesCount > 0,
      })
    }

    // Update target stats
    const targetModel =
      comment.targetType === "Recipe" ? (await import("@/server/models/Recipe")).default : (await import("@/server/models/Menu")).default
    await targetModel.findByIdAndUpdate(comment.targetId, { $inc: { "stats.commentsCount": -1 } })

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Comment deletion error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// POST like/unlike comment
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const token = await getAuthHeader()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const comment = await Comment.findById(params.id)
    if (!comment) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 })
    }

    const hasLiked = comment.likedBy.includes(userId as any)

    if (hasLiked) {
      // Unlike
      await Comment.findByIdAndUpdate(params.id, {
        $pull: { likedBy: userId },
        $inc: { likes: -1 },
      })
    } else {
      // Like
      await Comment.findByIdAndUpdate(params.id, {
        $addToSet: { likedBy: userId },
        $inc: { likes: 1 },
      })

      // Create notification
      if (comment.user.toString() !== userId) {
        const Notification = (await import("@/server/models/Notification")).default
        await Notification.create({
          recipient: comment.user,
          sender: userId,
          type: "like",
          targetType: "Comment",
          targetId: params.id,
          message: "Someone liked your comment",
        })
      }
    }

    const updatedComment = await Comment.findById(params.id)
    return NextResponse.json({ liked: !hasLiked, likes: updatedComment.likes })
  } catch (error) {
    console.error("Comment like error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
