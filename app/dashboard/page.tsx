"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/kitchen/Header"
import RecipeCard from "@/components/kitchen/RecipeCard"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/api"

interface Recipe {
  _id: string
  name: string
  description?: string
  category?: string
  imageUrl?: string
  isVegan?: boolean
  isVegetarian?: boolean
  cookingTimeMinutes?: number
}

export default function DashboardPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  // We no longer need separate filteredRecipes because filtering happens on backend
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 10 // Requirement: show 10 recipes

  const [filters, setFilters] = useState({
    search: "",
    category: "all", // default to "all" string to match select
    isVegetarian: false,
    isVegan: false,
  })

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token) {
      router.push("/login")
      return
    }

    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [router])

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Reset pagination when filters change (except search which is handled by debounce)
  useEffect(() => {
    setPage(1);
    fetchRecipes(1, true);
  }, [filters.category, filters.isVegetarian, filters.isVegan, debouncedSearch])

  const fetchRecipes = async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const queryParams = new URLSearchParams()
      queryParams.append("page", pageNum.toString())
      queryParams.append("limit", LIMIT.toString())

      if (debouncedSearch) queryParams.append("search", debouncedSearch)
      if (filters.category && filters.category !== "all") queryParams.append("category", filters.category)
      if (filters.isVegetarian) queryParams.append("isVegetarian", "true")
      if (filters.isVegan) queryParams.append("isVegan", "true")

      const response = await fetch(`${API_BASE_URL}/recipes?${queryParams.toString()}`)
      const data = await response.json()

      const newRecipes = data.recipes || []

      if (reset) {
        setRecipes(newRecipes);
      } else {
        setRecipes(prev => [...prev, ...newRecipes]);
      }

      // Update hasMore based on pagination data
      if (data.pagination) {
        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        setHasMore(newRecipes.length === LIMIT);
      }

    } catch (error) {
      console.error("Error fetching recipes:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecipes(nextPage, false);
  }

  const handleFilterChange = (name: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#f9faf7]">
      <Header user={user} onLogout={handleLogout} />

      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto p-4 md:p-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-lg p-6 md:h-fit md:sticky md:top-24 shadow-sm">
          <h2 className="text-xl font-bold text-[#2e7d32] mb-6">Find Recipes</h2>

          <div className="space-y-6">
            <div>
              <Input
                placeholder="Search recipes..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.isVegetarian}
                  onCheckedChange={(checked) => handleFilterChange("isVegetarian", checked)}
                />
                <span className="text-sm font-medium">Vegetarian Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.isVegan}
                  onCheckedChange={(checked) => handleFilterChange("isVegan", checked)}
                />
                <span className="text-sm font-medium">Vegan Only</span>
              </label>
            </div>

            <div>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Main Dish">Main Dish</SelectItem>
                  <SelectItem value="Appetizer">Appetizer</SelectItem>
                  <SelectItem value="Dessert">Dessert</SelectItem>
                  <SelectItem value="Soup">Soup</SelectItem>
                  <SelectItem value="Salad">Salad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Recipes Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : recipes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe._id} recipe={recipe} onClick={() => handleRecipeClick(recipe._id)} />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pb-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-8 py-3 rounded-full font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </>
                    ) : "View More"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm">
              <p className="text-gray-600 text-lg">No recipes found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
