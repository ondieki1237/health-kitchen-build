import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import themealdbService from "@/lib/themealdb"
import { verifyToken, getAuthHeader } from "@/lib/auth"

// POST trigger sync from TheMealDB
export async function POST(request: NextRequest) {
  try {
    // Optional: Add admin authentication check here
    const token = await getAuthHeader()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const { action, area, category, limit } = await request.json()

    let result

    switch (action) {
      case "sync-area":
        if (!area) {
          return NextResponse.json({ message: "Area is required" }, { status: 400 })
        }
        result = await themealdbService.syncMealsByArea(area, limit || 10)
        break

      case "sync-category":
        if (!category) {
          return NextResponse.json({ message: "Category is required" }, { status: 400 })
        }
        result = await themealdbService.syncMealsByCategory(category, limit || 10)
        break

      case "sync-all":
        result = await themealdbService.syncAllAreas(limit || 5)
        break

      case "random":
        const randomMeal = await themealdbService.getRandomMeal()
        if (randomMeal && (await themealdbService.isVegetarianMeal(randomMeal))) {
          result = await themealdbService.storeMeal(randomMeal)
          return NextResponse.json({ message: "Random meal synced", meal: result })
        } else {
          return NextResponse.json({ message: "Random meal was not vegetarian, try again" })
        }

      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      message: "Sync completed",
      result,
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// GET sync status and available options
export async function GET(request: NextRequest) {
  try {
    const vegetarianAreas = ["Indian", "Italian", "Mexican", "Thai", "Japanese", "Chinese", "Vietnamese", "Greek"]
    const vegetarianCategories = ["Vegetarian", "Side", "Pasta", "Dessert", "Breakfast", "Starter"]

    return NextResponse.json({
      availableAreas: vegetarianAreas,
      availableCategories: vegetarianCategories,
      actions: ["sync-area", "sync-category", "sync-all", "random"],
    })
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
