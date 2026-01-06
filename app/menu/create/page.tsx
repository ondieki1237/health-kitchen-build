"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, X } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"

export default function MenuBuilderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [menuData, setMenuData] = useState({
    name: "",
    description: "",
    type: "daily",
    meals: [] as any[],
    tags: "",
    isPublic: true,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const menuTypes = [
    { value: "daily", label: "Daily Menu" },
    { value: "weekly", label: "Weekly Menu" },
    { value: "special-occasion", label: "Special Occasion" },
    { value: "meal-prep", label: "Meal Prep" },
    { value: "budget", label: "Budget-Friendly" },
    { value: "quick", label: "Quick Meals" },
  ]

  const mealTimes = ["breakfast", "lunch", "dinner", "snack", "dessert"]

  const searchRecipes = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`${API_BASE_URL}/recipes?search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Error",
        description: "Failed to search recipes",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  const addMeal = (recipe: any, mealTime: string) => {
    setMenuData({
      ...menuData,
      meals: [
        ...menuData.meals,
        {
          mealTime,
          recipe: recipe._id,
          recipeName: recipe.name,
          recipeThumbnail: recipe.thumbnailUrl,
          servings: recipe.servingSize || 4,
          notes: "",
        },
      ],
    })
    toast({
      title: "Added",
      description: `${recipe.name} added to menu`,
    })
  }

  const removeMeal = (index: number) => {
    const newMeals = [...menuData.meals]
    newMeals.splice(index, 1)
    setMenuData({ ...menuData, meals: newMeals })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!menuData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a menu name",
        variant: "destructive",
      })
      return
    }

    if (menuData.meals.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one meal",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Error",
          description: "Please login first",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const response = await fetch(`${API_BASE_URL}/menus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...menuData,
          tags: menuData.tags.split(",").map((t) => t.trim()).filter(Boolean),
          meals: menuData.meals.map((m) => ({
            mealTime: m.mealTime,
            recipe: m.recipe,
            servings: m.servings,
            notes: m.notes,
          })),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Menu created successfully!",
        })
        router.push(`/menu/${data._id}`)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create menu",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Menu creation error:", error)
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Create Menu</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menu Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Menu Name *</label>
                <Input
                  value={menuData.name}
                  onChange={(e) => setMenuData({ ...menuData, name: e.target.value })}
                  placeholder="e.g., Healthy Week Menu"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={menuData.description}
                  onChange={(e) => setMenuData({ ...menuData, description: e.target.value })}
                  placeholder="Describe your menu..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Menu Type</label>
                <Select value={menuData.type} onValueChange={(value) => setMenuData({ ...menuData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {menuTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={menuData.tags}
                  onChange={(e) => setMenuData({ ...menuData, tags: e.target.value })}
                  placeholder="healthy, budget-friendly, family"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search & Add Recipes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes..."
                  onKeyPress={(e) => e.key === "Enter" && searchRecipes()}
                />
                <Button onClick={searchRecipes} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {searchResults.map((recipe: any) => (
                  <div key={recipe._id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{recipe.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {recipe.category} • {recipe.cookingTimeMinutes || "?"} min
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {mealTimes.map((time) => (
                        <Button
                          key={time}
                          size="sm"
                          variant="outline"
                          onClick={() => addMeal(recipe, time)}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menu Preview ({menuData.meals.length} meals)</CardTitle>
            </CardHeader>
            <CardContent>
              {menuData.meals.length === 0 ? (
                <p className="text-muted-foreground text-sm">No meals added yet. Search and add recipes to build your menu.</p>
              ) : (
                <div className="space-y-3">
                  {menuData.meals.map((meal, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                              {meal.mealTime}
                            </span>
                          </div>
                          <h4 className="font-medium">{meal.recipeName}</h4>
                          <p className="text-xs text-muted-foreground">Servings: {meal.servings}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeMeal(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleSubmit} disabled={loading || menuData.meals.length === 0} className="w-full mt-4">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Creating..." : "Create Menu"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
