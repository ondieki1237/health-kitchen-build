import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/server/lib/db"
import User from "@/server/models/User"
import Recipe from "@/server/models/Recipe"
import { verifyToken, getAuthHeader } from "@/server/lib/auth"

// POST save/unsave recipe
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

    const recipe = await Recipe.findById(params.id)
    if (!recipe) {
      return NextResponse.json({ message: "Recipe not found" }, { status: 404 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const hasSaved = user.savedRecipes.includes(params.id as any)

    if (hasSaved) {
      // Unsave
      await User.findByIdAndUpdate(userId, { $pull: { savedRecipes: params.id } })
      await Recipe.findByIdAndUpdate(params.id, { $inc: { "stats.favorites": -1 } })
    } else {
      // Save
      await User.findByIdAndUpdate(userId, { $addToSet: { savedRecipes: params.id } })
      await Recipe.findByIdAndUpdate(params.id, { $inc: { "stats.favorites": 1 } })

      // Create notification for recipe owner
      if (recipe.createdBy && recipe.createdBy.toString() !== userId) {
        const Notification = (await import("@/server/models/Notification")).default
        await Notification.create({
          recipient: recipe.createdBy,
          sender: userId,
          type: "like",
          targetType: "Recipe",
          targetId: params.id,
          message: "Someone saved your recipe!",
        })
      }
    }

    return NextResponse.json({ saved: !hasSaved })
  } catch (error) {
    console.error("Recipe save error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
