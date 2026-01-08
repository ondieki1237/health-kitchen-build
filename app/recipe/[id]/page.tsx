"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/components/kitchen/Header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/api"
import CookingAttemptDialog from "@/components/kitchen/CookingAttemptDialog"
import { Star, Trash2, Edit } from "lucide-react"
import { format } from "date-fns"
import ImageUploader from "@/components/ui/ImageUploader"
import { toast } from "sonner"

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
  instructions?: Array<{ stepNumber: number; instruction: string } | string>
  likes?: number
  createdBy?: {
    _id: string
    displayName: string
    avatar?: string
    username?: string
  }
  stats?: {
    averageRating: number
    totalRatings: number
    tried: number
  }
}

interface Review {
  _id: string
  user: {
    _id: string
    displayName: string
    avatar?: string
  }
  rating: number
  review: string
  createdAt: string
  difficultyExperienced?: string
}

export default function RecipeDetailPage() {
  const { id } = useParams()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    if (id) {
      fetchRecipe()
      fetchReviews()
    }
  }, [id])

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${id}`)
      if (!response.ok) throw new Error("Recipe not found")
      const data = await response.json()
      setRecipe(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading recipe")
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cooking-attempts/public?targetId=${id}&targetType=Recipe&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.attempts || [])
      }
    } catch (e) {
      console.error("Failed to load reviews", e)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const handleImageUpdate = async (url: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Please login to upload photos")
        return
      }

      const res = await fetch(`${API_BASE_URL}/recipes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: url })
      })

      if (!res.ok) throw new Error("Failed to update recipe image")

      setRecipe(prev => prev ? { ...prev, imageUrl: url } : null)
      toast.success("Recipe image updated!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to save image")
    }
  }

  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (typeof window !== 'undefined' && !window.confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/recipes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error("Failed to delete recipe")

      toast.success("Recipe deleted")
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete recipe")
      setIsDeleting(false)
    }
  }

  const isCreator = user && recipe && recipe.createdBy && (user._id === recipe.createdBy._id || user.id === recipe.createdBy._id)

  if (loading) {
    //...
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
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            ← Back
          </Button>

          <div className="flex gap-2">
            {isCreator && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/recipes/${id}/edit`)}
                  className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </>
            )}
            <CookingAttemptDialog
              targetId={recipe._id}
              targetName={recipe.name}
              onSuccess={() => {
                fetchRecipe(); // Refresh stats
                fetchReviews(); // Refresh reviews
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg overflow-hidden mb-6 shadow-sm relative group">
          {recipe.imageUrl ? (
            <>
              <img src={recipe.imageUrl || "/placeholder.svg"} alt={recipe.name} className="w-full h-96 object-cover" />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageUploader
                  onUploadComplete={handleImageUpdate}
                  buttonLabel="Change Photo"
                  className="bg-white/90 rounded-md shadow-sm"
                />
              </div>
            </>
          ) : (
            <div className="w-full h-96 bg-gray-100 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 m-4 rounded-lg">
              <span className="text-gray-500">No image yet. Add one!</span>
              <ImageUploader
                onUploadComplete={handleImageUpdate}
                buttonLabel="Upload Photo"
              />
            </div>
          )}

          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <h1 className="text-4xl font-bold text-gray-900">{recipe.name}</h1>
              <div className="flex flex-col items-end">
                {recipe.stats?.averageRating ? (
                  <div className="flex items-center gap-1 bg-[#fff8e1] px-3 py-1 rounded-full border border-[#ffecb3]">
                    <Star className="w-5 h-5 fill-[#f57c00] text-[#f57c00]" />
                    <span className="font-bold text-[#f57c00] text-lg">{recipe.stats.averageRating.toFixed(1)}</span>
                    <span className="text-gray-500 text-sm">({recipe.stats.totalRatings})</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">No ratings yet</span>
                )}
              </div>
            </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Ingredients */}
          <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
            <h2 className="text-2xl font-bold text-[#2e7d32] mb-4">Ingredients</h2>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <ul className="space-y-3">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex justify-between border-l-4 border-[#66bb6a] pl-4">
                    <span className="font-medium text-gray-800">{ing.name}</span>
                    {ing.quantity && (
                      <span className="text-[#f57c00] font-medium">
                        {ing.quantity} {ing.measurement}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No ingredients listed.</p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
            <h2 className="text-2xl font-bold text-[#2e7d32] mb-4">Instructions</h2>
            {recipe.instructions && recipe.instructions.length > 0 ? (
              <ol className="space-y-4">
                {recipe.instructions.map((inst, idx) => {
                  const stepNum = typeof inst === 'string' ? idx + 1 : inst.stepNumber || idx + 1;
                  const text = typeof inst === 'string' ? inst : inst.instruction;
                  return (
                    <li key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#fbe9e7] text-[#f57c00] flex items-center justify-center font-bold">
                        {stepNum}
                      </div>
                      <p className="text-gray-700 mt-1">{text}</p>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="text-gray-500 italic">No instructions listed.</p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#2e7d32]">Community Reviews</h2>
            <span className="text-gray-500">{recipe.stats?.tried || 0} people have tried this</span>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#2e7d32] font-bold">
                        {review.user?.displayName?.[0] || "U"}
                      </div>
                      <span className="font-medium text-gray-900">{review.user?.displayName || "Anonymous"}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(review.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? "fill-[#f57c00] text-[#f57c00]" : "text-gray-300"}`}
                      />
                    ))}
                    {review.difficultyExperienced && (
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        {review.difficultyExperienced}
                      </span>
                    )}
                  </div>

                  {review.review && (
                    <p className="text-gray-600">{review.review}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No reviews yet. Be the first to try this recipe!</p>
              <CookingAttemptDialog
                targetId={recipe._id}
                targetName={recipe.name}
                onSuccess={() => {
                  fetchRecipe();
                  fetchReviews();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
