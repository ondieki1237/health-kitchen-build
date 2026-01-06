"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/components/kitchen/Header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Recipe {
  _id: string
  name: string
  description?: string
  imageUrl?: string
  category?: string
  cuisine?: string
  isVegan?: boolean
  isVegetarian?: boolean
  difficultyLevel?: string
  cookingTimeMinutes?: number
  servingSize?: number
  caloriesPerServing?: number
  ingredients?: Array<{ name: string; quantity: number; measurement: string }>
  instructions?: string[]
  likes?: number
}

export default function RecipeDetailPage() {
  const { id } = useParams()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchRecipe()
  }, [id])

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${id}`)
      if (!response.ok) throw new Error("Recipe not found")
      const data = await response.json()
      setRecipe(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading recipe")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9faf7]">
        <Header user={user} onLogout={handleLogout} />
        <div className="text-center py-12">Loading recipe...</div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-[#f9faf7]">
        <Header user={user} onLogout={handleLogout} />
        <div className="text-center py-12 text-red-600">{error || "Recipe not found"}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9faf7]">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← Back
        </Button>

        <div className="bg-white rounded-lg overflow-hidden mb-6">
          {recipe.imageUrl && (
            <img src={recipe.imageUrl || "/placeholder.svg"} alt={recipe.name} className="w-full h-96 object-cover" />
          )}

          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{recipe.name}</h1>

            {recipe.description && <p className="text-lg text-gray-600 mb-6">{recipe.description}</p>}

            <div className="flex flex-wrap gap-4 mb-6">
              {recipe.difficultyLevel && (
                <div>
                  <span className="font-semibold text-gray-700">Difficulty:</span>
                  <span className="ml-2">{recipe.difficultyLevel}</span>
                </div>
              )}
              {recipe.cookingTimeMinutes && (
                <div>
                  <span className="font-semibold text-gray-700">Time:</span>
                  <span className="ml-2">{recipe.cookingTimeMinutes} mins</span>
                </div>
              )}
              {recipe.servingSize && (
                <div>
                  <span className="font-semibold text-gray-700">Servings:</span>
                  <span className="ml-2">{recipe.servingSize}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {recipe.isVegan && <Badge className="bg-[#66bb6a]">Vegan</Badge>}
              {recipe.isVegetarian && <Badge className="bg-[#2e7d32]">Vegetarian</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-[#2e7d32] mb-4">Ingredients</h2>
              <ul className="space-y-3">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex justify-between border-l-4 border-[#66bb6a] pl-4">
                    <span className="font-medium">{ing.name}</span>
                    <span className="text-[#f57c00]">
                      {ing.quantity} {ing.measurement}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-[#2e7d32] mb-4">Instructions</h2>
              <ol className="space-y-3">
                {recipe.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="font-bold text-[#f57c00] flex-shrink-0">{idx + 1}.</span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
