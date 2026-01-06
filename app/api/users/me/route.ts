import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/server/lib/db"
import User from "@/server/models/User"
import { verifyToken, getAuthHeader } from "@/server/lib/auth"

// GET current user profile
export async function GET(request: NextRequest) {
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

    const user = await User.findById(userId)
      .select("-passwordHash")
      .populate("savedRecipes", "name thumbnailUrl category cuisine")
      .populate("savedMenus", "name coverImage type")

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("User fetch error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
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

    const { displayName, bio, location, avatar, dietaryPreferences } = await request.json()

    const updates: any = {}
    if (displayName !== undefined) updates.displayName = displayName
    if (bio !== undefined) updates.bio = bio
    if (location !== undefined) updates.location = location
    if (avatar !== undefined) updates.avatar = avatar
    if (dietaryPreferences !== undefined) updates.dietaryPreferences = dietaryPreferences
    updates.updatedAt = new Date()

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-passwordHash")

    return NextResponse.json(user)
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
