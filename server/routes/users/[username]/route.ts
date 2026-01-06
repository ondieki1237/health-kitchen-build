import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/models/User"

// GET user profile by username
export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    await connectDB()

    const user = await User.findOne({ username: params.username })
      .select("-passwordHash -email")
      .populate("savedRecipes", "name thumbnailUrl")

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get user's recipes
    const Recipe = (await import("@/models/Recipe")).default
    const userRecipes = await Recipe.find({ createdBy: user._id }).limit(20).sort({ createdAt: -1 })

    // Get user's menus
    const Menu = (await import("@/models/Menu")).default
    const userMenus = await Menu.find({ createdBy: user._id, isPublic: true })
      .limit(20)
      .sort({ createdAt: -1 })

    // Get user's cooking attempts
    const CookingAttempt = (await import("@/models/CookingAttempt")).default
    const userAttempts = await CookingAttempt.find({ user: user._id, isPublic: true })
      .populate("targetId", "name thumbnailUrl")
      .limit(10)
      .sort({ createdAt: -1 })

    return NextResponse.json({
      user,
      recipes: userRecipes,
      menus: userMenus,
      attempts: userAttempts,
    })
  } catch (error) {
    console.error("User profile fetch error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
