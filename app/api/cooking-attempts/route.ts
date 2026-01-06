import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/server/lib/db"
import CookingAttempt from "@/server/models/CookingAttempt"
import { verifyToken, getAuthHeader } from "@/server/lib/auth"

// GET cooking attempts
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get("targetType")
    const targetId = searchParams.get("targetId")
    const userId = searchParams.get("userId")

    const filter: any = { isPublic: true }

    if (targetType) filter.targetType = targetType
    if (targetId) filter.targetId = targetId
    if (userId) filter.user = userId

    const attempts = await CookingAttempt.find(filter)
      .populate("user", "username displayName avatar")
      .populate("targetId", "name thumbnailUrl")
      .sort({ createdAt: -1 })
      .limit(50)

    return NextResponse.json(attempts)
  } catch (error) {
    console.error("Cooking attempt fetch error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// POST create new cooking attempt
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

    const {
      targetType,
      targetId,
      photos,
      rating,
      review,
      actualCookingTime,
      difficultyExperienced,
      modifications,
      tips,
      wouldMakeAgain,
      servedTo,
      occasion,
      estimatedCost,
      isPublic,
    } = await request.json()

    if (!targetType || !targetId || !rating) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const attempt = new CookingAttempt({
      user: userId,
      targetType,
      targetId,
      photos,
      rating,
      review,
      actualCookingTime,
      difficultyExperienced,
      modifications,
      tips,
      wouldMakeAgain,
      servedTo,
      occasion,
      estimatedCost,
      isPublic: isPublic !== undefined ? isPublic : true,
    })

    await attempt.save()

    // Update target stats
    const targetModel =
      targetType === "Recipe" ? (await import("@/server/models/Recipe")).default : (await import("@/server/models/Menu")).default
    const target: any = await targetModel.findById(targetId)

    if (target) {
      const newTotalRatings = target.stats.totalRatings + 1
      const newAverageRating = (target.stats.averageRating * target.stats.totalRatings + rating) / newTotalRatings
      await targetModel.findByIdAndUpdate(targetId, {
        "stats.averageRating": newAverageRating,
        "stats.totalRatings": newTotalRatings,
        $inc: { "stats.tried": 1 },
      })

      // Create notification for content owner
      if (target.createdBy && target.createdBy.toString() !== userId) {
        const Notification = (await import("@/server/models/Notification")).default
        await Notification.create({
          recipient: target.createdBy,
          sender: userId,
          type: "cooking-milestone",
          targetType,
          targetId,
          message: `Someone tried your ${targetType.toLowerCase()}!`,
          image: photos && photos.length > 0 ? photos[0] : undefined,
        })
      }
    }

    const populatedAttempt = await CookingAttempt.findById(attempt._id)
      .populate("user", "username displayName avatar")
      .populate("targetId", "name thumbnailUrl")

    return NextResponse.json(populatedAttempt, { status: 201 })
  } catch (error) {
    console.error("Cooking attempt creation error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
