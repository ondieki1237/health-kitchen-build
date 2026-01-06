import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Menu from "@/models/Menu"
import { verifyToken, getAuthHeader } from "@/lib/auth"

// GET all menus or filter
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const userId = searchParams.get("userId")
    const featured = searchParams.get("featured")
    const search = searchParams.get("search")

    const filter: any = { isPublic: true }

    if (type) filter.type = type
    if (userId) filter.createdBy = userId
    if (featured === "true") filter.isFeatured = true
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const menus = await Menu.find(filter)
      .populate("createdBy", "username displayName avatar")
      .populate("meals.recipe", "name thumbnailUrl cookingTimeMinutes")
      .sort({ createdAt: -1 })
      .limit(50)

    return NextResponse.json(menus)
  } catch (error) {
    console.error("Menu fetch error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// POST create new menu
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

    const { name, description, type, meals, coverImage, tags, isPublic } = await request.json()

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")

    // Calculate total cooking time
    let totalCookingTime = 0
    if (meals && meals.length > 0) {
      // Would need to populate recipes to calculate, simplified here
      totalCookingTime = meals.length * 30 // Estimate
    }

    const menu = new Menu({
      name,
      slug: `${slug}-${Date.now()}`,
      description,
      type,
      meals,
      coverImage,
      tags,
      isPublic: isPublic !== undefined ? isPublic : true,
      totalCookingTime,
      createdBy: userId,
    })

    await menu.save()

    // Update user stats
    const User = (await import("@/models/User")).default
    await User.findByIdAndUpdate(userId, { $inc: { "stats.menusCreated": 1 } })

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    console.error("Menu creation error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
