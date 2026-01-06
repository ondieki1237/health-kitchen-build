import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/server/lib/db"
import Comment from "@/server/models/Comment"
import { verifyToken, getAuthHeader } from "@/server/lib/auth"

// GET comments for a target (recipe or menu)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get("targetType")
    const targetId = searchParams.get("targetId")
    const parentComment = searchParams.get("parentComment")

    if (!targetType || !targetId) {
      return NextResponse.json({ message: "Missing targetType or targetId" }, { status: 400 })
    }

    const filter: any = {
      targetType,
      targetId,
      isHidden: false,
    }

    if (parentComment) {
      filter.parentComment = parentComment
    } else {
      filter.parentComment = null
    }

    const comments = await Comment.find(filter)
      .populate("user", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(100)

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Comment fetch error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// POST create new comment
export async function POST(request: NextRequest) {
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

    const { targetType, targetId, content, rating, userPhoto, modifications, cookingTips, parentComment } =
      await request.json()

    if (!targetType || !targetId || !content) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const comment = new Comment({
      targetType,
      targetId,
      user: userId,
      content,
      rating,
      userPhoto,
      modifications,
      cookingTips,
      parentComment,
    })

    await comment.save()

    // Update parent comment if reply
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        hasReplies: true,
        $inc: { repliesCount: 1 },
      })
    }

    // Update target stats
    const targetModel = targetType === "Recipe" ? (await import("@/server/models/Recipe")).default : (await import("@/server/models/Menu")).default
    await targetModel.findByIdAndUpdate(targetId, { $inc: { "stats.commentsCount": 1 } })

    // If rating provided, update average rating
    if (rating) {
      const target: any = await targetModel.findById(targetId)
      if (target) {
        const newTotalRatings = target.stats.totalRatings + 1
        const newAverageRating =
          (target.stats.averageRating * target.stats.totalRatings + rating) / newTotalRatings
        await targetModel.findByIdAndUpdate(targetId, {
          "stats.averageRating": newAverageRating,
          "stats.totalRatings": newTotalRatings,
        })
      }
    }

    // Create notification for content owner
    const Notification = (await import("@/server/models/Notification")).default
    const target: any = await targetModel.findById(targetId)
    if (target && target.createdBy && target.createdBy.toString() !== userId) {
      await Notification.create({
        recipient: target.createdBy,
        sender: userId,
        type: "comment",
        targetType,
        targetId,
        message: `Someone commented on your ${targetType.toLowerCase()}`,
      })
    }

    const populatedComment = await Comment.findById(comment._id).populate("user", "username displayName avatar")

    return NextResponse.json(populatedComment, { status: 201 })
  } catch (error) {
    console.error("Comment creation error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
