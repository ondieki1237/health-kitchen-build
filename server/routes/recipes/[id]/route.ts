import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Recipe from "@/models/Recipe"
import { verifyToken, getAuthHeader } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    const recipe = await Recipe.findById(id).populate("createdBy", "displayName avatar")
    if (!recipe) {
      return NextResponse.json({ message: "Recipe not found" }, { status: 404 })
    }

    return NextResponse.json(recipe)
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const recipe = await Recipe.findById(id)

    if (!recipe) {
      return NextResponse.json({ message: "Recipe not found" }, { status: 404 })
    }

    if (recipe.likedBy.includes(userId)) {
      recipe.likedBy = recipe.likedBy.filter((uid: any) => !uid.equals(userId))
      recipe.likes--
    } else {
      recipe.likedBy.push(userId)
      recipe.likes++
    }

    await recipe.save()
    return NextResponse.json(recipe)
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
