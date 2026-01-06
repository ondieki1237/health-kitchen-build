"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Search, Filter, SlidersHorizontal } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { API_BASE_URL } from "@/lib/api"

export default function SearchPage() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<any>({
    categories: [],
    cuisines: [],
    isVegan: false,
    isVegetarian: false,
    maxCookingTime: "",
    minRating: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  })
  const [filterOptions, setFilterOptions] = useState<any>({
    categories: [],
    cuisines: [],
    tags: [],
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/search/filters`)
      const data = await response.json()
      setFilterOptions(data)
    } catch (error) {
      console.error("Error fetching filter options:", error)
    }
  }

  const handleSearch = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("q", searchQuery)
      if (filters.maxCookingTime) params.append("maxCookingTime", filters.maxCookingTime)
      if (filters.minRating) params.append("minRating", filters.minRating)
      if (filters.isVegan) params.append("isVegan", "true")
      if (filters.isVegetarian) params.append("isVegetarian", "true")
      params.append("sortBy", filters.sortBy)
      params.append("sortOrder", filters.sortOrder)
      params.append("page", page.toString())
      params.append("limit", pagination.limit.toString())

      const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`)
      const data = await response.json()

      setRecipes(data.recipes)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Search Recipes</h1>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for recipes..."
              className="pl-10"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={() => handleSearch()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Recipes</SheetTitle>
                <SheetDescription>Refine your search with advanced filters</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Dietary Preferences */}
                <div className="space-y-2">
                  <h3 className="font-medium">Dietary Preferences</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vegan"
                      checked={filters.isVegan}
                      onCheckedChange={(checked) => setFilters({ ...filters, isVegan: checked })}
                    />
                    <label htmlFor="vegan" className="text-sm">
                      Vegan
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vegetarian"
                      checked={filters.isVegetarian}
                      onCheckedChange={(checked) => setFilters({ ...filters, isVegetarian: checked })}
                    />
                    <label htmlFor="vegetarian" className="text-sm">
                      Vegetarian
                    </label>
                  </div>
                </div>

                <Separator />

                {/* Cooking Time */}
                <div className="space-y-2">
                  <label className="font-medium">Max Cooking Time (minutes)</label>
                  <Input
                    type="number"
                    value={filters.maxCookingTime}
                    onChange={(e) => setFilters({ ...filters, maxCookingTime: e.target.value })}
                    placeholder="e.g., 30"
                  />
                </div>

                <Separator />

                {/* Rating */}
                <div className="space-y-2">
                  <label className="font-medium">Minimum Rating</label>
                  <Select
                    value={filters.minRating}
                    onValueChange={(value) => setFilters({ ...filters, minRating: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any rating</SelectItem>
                      <SelectItem value="4">4+ stars</SelectItem>
                      <SelectItem value="3">3+ stars</SelectItem>
                      <SelectItem value="2">2+ stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Sort */}
                <div className="space-y-2">
                  <label className="font-medium">Sort By</label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Newest</SelectItem>
                      <SelectItem value="stats.averageRating">Rating</SelectItem>
                      <SelectItem value="stats.views">Most Viewed</SelectItem>
                      <SelectItem value="stats.favorites">Most Saved</SelectItem>
                      <SelectItem value="cookingTimeMinutes">Cooking Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => handleSearch()} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {filters.isVegan && <Badge variant="secondary">Vegan</Badge>}
          {filters.isVegetarian && <Badge variant="secondary">Vegetarian</Badge>}
          {filters.maxCookingTime && <Badge variant="secondary">Under {filters.maxCookingTime} min</Badge>}
          {filters.minRating && <Badge variant="secondary">{filters.minRating}+ stars</Badge>}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Found {pagination.total} recipe{pagination.total !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe: any) => (
              <Card key={recipe._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <a href={`/recipe/${recipe._id}`}>
                  {recipe.thumbnailUrl && (
                    <div className="w-full h-48 overflow-hidden">
                      <img src={recipe.thumbnailUrl} alt={recipe.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{recipe.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span>{recipe.cookingTimeMinutes || "?"} min</span>
                      <span className="flex items-center gap-1">
                        ⭐ {recipe.stats.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {recipe.isVegan && <Badge variant="secondary">Vegan</Badge>}
                      {recipe.isVegetarian && <Badge variant="secondary">Vegetarian</Badge>}
                    </div>
                  </CardContent>
                </a>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handleSearch(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => handleSearch(pagination.page + 1)}
                disabled={pagination.page === pagination.pages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
