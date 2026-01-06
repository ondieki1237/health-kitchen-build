"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/kitchen/Header"
import RecipeCard from "@/components/kitchen/RecipeCard"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    isVegetarian: false,
    isVegan: false,
  })
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

    fetchRecipes()
  }, [router])

  useEffect(() => {
    applyFilters()
  }, [recipes, filters])

  const fetchRecipes = async () => {
    try {
      const response = await fetch("/api/recipes")
      const data = await response.json()
      setRecipes(data)
      setFilteredRecipes(data)
    } catch (error) {
      console.error("Error fetching recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = recipes

    if (filters.search) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          (r.description && r.description.toLowerCase().includes(filters.search.toLowerCase())),
      )
    }

    if (filters.category) {
      filtered = filtered.filter((r) => r.category === filters.category)
    }

    if (filters.isVegetarian) {
      filtered = filtered.filter((r) => r.isVegetarian)
    }

    if (filters.isVegan) {
      filtered = filtered.filter((r) => r.isVegan)
    }

    setFilteredRecipes(filtered)
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
        <div className="w-full md:w-64 bg-white rounded-lg p-6 md:h-fit md:sticky md:top-24">
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
            <div className="text-center py-12">
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe._id} recipe={recipe} onClick={() => handleRecipeClick(recipe._id)} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-600 text-lg">No recipes found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
