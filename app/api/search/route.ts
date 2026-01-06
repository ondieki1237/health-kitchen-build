import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/server/lib/db"
import Recipe from "@/server/models/Recipe"

// GET advanced search with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)

    // Text search
    const query = searchParams.get("q")

    // Filters
    const category = searchParams.get("category")
    const cuisine = searchParams.get("cuisine")
    const isVegan = searchParams.get("isVegan")
    const isVegetarian = searchParams.get("isVegetarian")
    const difficultyLevel = searchParams.get("difficulty")
    const maxCookingTime = searchParams.get("maxCookingTime")
    const minRating = searchParams.get("minRating")
    const tags = searchParams.get("tags") // Comma-separated

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1

    // Pagination
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Build filter
    const filter: any = {}

    // Text search using MongoDB text index
    if (query && query.trim()) {
      filter.$text = { $search: query }
    }

    if (category) filter.category = category
    if (cuisine) filter.cuisine = cuisine
    if (isVegan === "true") filter.isVegan = true
    if (isVegetarian === "true") filter.isVegetarian = true
    if (difficultyLevel) filter.difficultyLevel = difficultyLevel
    if (maxCookingTime) filter.cookingTimeMinutes = { $lte: parseInt(maxCookingTime) }
    if (minRating) filter["stats.averageRating"] = { $gte: parseFloat(minRating) }

    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim())
      filter.tags = { $in: tagArray }
    }

    // Build sort object
    const sort: any = {}
    if (query && filter.$text) {
      sort.score = { $meta: "textScore" }
    }
    sort[sortBy] = sortOrder

    // Execute query with projection for text score
    const projection = query && filter.$text ? { score: { $meta: "textScore" } } : {}

    const recipes = await Recipe.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "username displayName avatar")

    const total = await Recipe.countDocuments(filter)

    return NextResponse.json({
      recipes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        query,
        category,
        cuisine,
        isVegan,
        isVegetarian,
        difficultyLevel,
        maxCookingTime,
        minRating,
        tags,
      },
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// POST advanced search with complex filters
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const {
      query,
      categories,
      cuisines,
      isVegan,
      isVegetarian,
      difficulties,
      maxCookingTime,
      minCookingTime,
      minRating,
      maxRating,
      tags,
      ingredientsInclude,
      ingredientsExclude,
      sortBy,
      sortOrder,
      page,
      limit,
    } = await request.json()

    // Build filter
    const filter: any = {}

    // Text search
    if (query && query.trim()) {
      filter.$text = { $search: query }
    }

    // Array filters
    if (categories && categories.length > 0) filter.category = { $in: categories }
    if (cuisines && cuisines.length > 0) filter.cuisine = { $in: cuisines }
    if (difficulties && difficulties.length > 0) filter.difficultyLevel = { $in: difficulties }

    // Boolean filters
    if (isVegan) filter.isVegan = true
    if (isVegetarian) filter.isVegetarian = true

    // Range filters
    if (maxCookingTime || minCookingTime) {
      filter.cookingTimeMinutes = {}
      if (maxCookingTime) filter.cookingTimeMinutes.$lte = maxCookingTime
      if (minCookingTime) filter.cookingTimeMinutes.$gte = minCookingTime
    }

    if (minRating || maxRating) {
      filter["stats.averageRating"] = {}
      if (minRating) filter["stats.averageRating"].$gte = minRating
      if (maxRating) filter["stats.averageRating"].$lte = maxRating
    }

    // Tags
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags }
    }

    // Ingredient filters
    if (ingredientsInclude && ingredientsInclude.length > 0) {
      filter["ingredients.name"] = { $in: ingredientsInclude.map((i: string) => new RegExp(i, "i")) }
    }

    if (ingredientsExclude && ingredientsExclude.length > 0) {
      filter["ingredients.name"] = {
        ...filter["ingredients.name"],
        $nin: ingredientsExclude.map((i: string) => new RegExp(i, "i")),
      }
    }

    // Pagination
    const pageNum = page || 1
    const limitNum = limit || 20
    const skip = (pageNum - 1) * limitNum

    // Sort
    const sort: any = {}
    if (query && filter.$text) {
      sort.score = { $meta: "textScore" }
    }
    sort[sortBy || "createdAt"] = sortOrder === "asc" ? 1 : -1

    // Execute query
    const projection = query && filter.$text ? { score: { $meta: "textScore" } } : {}

    const recipes = await Recipe.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("createdBy", "username displayName avatar")

    const total = await Recipe.countDocuments(filter)

    return NextResponse.json({
      recipes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error("Advanced search error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
