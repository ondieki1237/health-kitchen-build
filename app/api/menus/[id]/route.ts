import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/server/lib/db"
import Menu from "@/server/models/Menu"
import { verifyToken, getAuthHeader } from "@/server/lib/auth"

// GET single menu by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const menu = await Menu.findById(params.id)
      .populate("createdBy", "username displayName avatar bio")
      .populate("meals.recipe")

    if (!menu) {
      return NextResponse.json({ message: "Menu not found" }, { status: 404 })
    }

    // Increment view count
    await Menu.findByIdAndUpdate(params.id, { $inc: { "stats.views": 1 } })

    return NextResponse.json(menu)
  } catch (error) {
    console.error("Menu fetch error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// PUT update menu
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

    const menu = await Menu.findById(params.id)
    if (!menu) {
      return NextResponse.json({ message: "Menu not found" }, { status: 404 })
    }

    // Check ownership
    if (menu.createdBy.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const updates = await request.json()
    const updatedMenu = await Menu.findByIdAndUpdate(params.id, updates, { new: true })

    return NextResponse.json(updatedMenu)
  } catch (error) {
    console.error("Menu update error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// DELETE menu
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

    const menu = await Menu.findById(params.id)
    if (!menu) {
      return NextResponse.json({ message: "Menu not found" }, { status: 404 })
    }

    // Check ownership
    if (menu.createdBy.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await Menu.findByIdAndDelete(params.id)

    // Update user stats
    const User = (await import("@/server/models/User")).default
    await User.findByIdAndUpdate(userId, { $inc: { "stats.menusCreated": -1 } })

    return NextResponse.json({ message: "Menu deleted successfully" })
  } catch (error) {
    console.error("Menu deletion error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
