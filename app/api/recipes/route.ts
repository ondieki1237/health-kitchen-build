import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/server/lib/db"
import Recipe from "@/server/models/Recipe"
import { verifyToken, getAuthHeader } from "@/server/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const cuisine = searchParams.get("cuisine")
    const isVegetarian = searchParams.get("isVegetarian")
    const isVegan = searchParams.get("isVegan")
    const search = searchParams.get("search")

    const filter: any = {}

    if (category) filter.category = category
    if (cuisine) filter.cuisine = cuisine
    if (isVegetarian === "true") filter.isVegetarian = true
    if (isVegan === "true") filter.isVegan = true
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const recipes = await Recipe.find(filter).limit(50)
    return NextResponse.json(recipes)
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

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
      name,
      description,
      category,
      cuisine,
      ingredients,
      instructions,
      cookingTimeMinutes,
      servingSize,
      difficultyLevel,
      isVegetarian,
      isVegan,
      imageUrl,
    } = await request.json()

    const recipe = new Recipe({
      name,
      description,
      category,
      cuisine,
      ingredients,
      instructions,
      cookingTimeMinutes,
      servingSize,
      difficultyLevel,
      isVegetarian,
      isVegan,
      imageUrl,
      createdBy: userId,
    })

    await recipe.save()
    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error("Recipe creation error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
