import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Recipe from "@/models/Recipe"

// GET filter options (categories, cuisines, tags)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get unique categories
    const categories = await Recipe.distinct("category")

    // Get unique cuisines
    const cuisines = await Recipe.distinct("cuisine")

    // Get unique tags
    const tags = await Recipe.distinct("tags")

    // Get difficulty levels
    const difficulties = ["Easy", "Medium", "Hard"]

    // Get cooking time ranges
    const cookingTimeRanges = [
      { label: "Under 15 min", max: 15 },
      { label: "15-30 min", min: 15, max: 30 },
      { label: "30-60 min", min: 30, max: 60 },
      { label: "Over 1 hour", min: 60 },
    ]

    return NextResponse.json({
      categories: categories.filter(Boolean).sort(),
      cuisines: cuisines.filter(Boolean).sort(),
      tags: tags.filter(Boolean).sort(),
      difficulties,
      cookingTimeRanges,
    })
  } catch (error) {
    console.error("Filter options fetch error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
