import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import CookingAttempt from "@/models/CookingAttempt"
import { verifyToken, getAuthHeader } from "@/lib/auth"

// GET single cooking attempt
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const attempt = await CookingAttempt.findById(params.id)
      .populate("user", "username displayName avatar bio")
      .populate("targetId")

    if (!attempt) {
      return NextResponse.json({ message: "Cooking attempt not found" }, { status: 404 })
    }

    return NextResponse.json(attempt)
  } catch (error) {
    console.error("Cooking attempt fetch error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// PUT update cooking attempt
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

    const attempt = await CookingAttempt.findById(params.id)
    if (!attempt) {
      return NextResponse.json({ message: "Cooking attempt not found" }, { status: 404 })
    }

    // Check ownership
    if (attempt.user.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const updates = await request.json()
    const updatedAttempt = await CookingAttempt.findByIdAndUpdate(params.id, updates, { new: true }).populate(
      "user",
      "username displayName avatar"
    )

    return NextResponse.json(updatedAttempt)
  } catch (error) {
    console.error("Cooking attempt update error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// DELETE cooking attempt
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

    const attempt = await CookingAttempt.findById(params.id)
    if (!attempt) {
      return NextResponse.json({ message: "Cooking attempt not found" }, { status: 404 })
    }

    // Check ownership
    if (attempt.user.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await CookingAttempt.findByIdAndDelete(params.id)

    return NextResponse.json({ message: "Cooking attempt deleted successfully" })
  } catch (error) {
    console.error("Cooking attempt deletion error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
