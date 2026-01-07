"use client"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface Recipe {
  _id: string
  name: string
  description?: string
  category?: string
  imageUrl?: string
  isVegan?: boolean
  isVegetarian?: boolean
  cookingTimeMinutes?: number
  stats?: {
    averageRating: number
    totalRatings: number
  }
}

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
    >
      <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl || "/placeholder.svg"}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="bg-[#f57c00] text-white px-4 py-2 rounded font-semibold">View Recipe</button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{recipe.name}</h3>

        {recipe.category && <p className="text-sm text-[#66bb6a] font-semibold mb-2">{recipe.category}</p>}

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {recipe.isVegan && <Badge className="bg-[#66bb6a] text-xs">Vegan</Badge>}
            {recipe.isVegetarian && <Badge className="bg-[#2e7d32] text-xs">Vegetarian</Badge>}
          </div>

          {recipe.cookingTimeMinutes && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {recipe.cookingTimeMinutes}m
            </div>
          )}
          {recipe.stats?.averageRating ? (
            <div className="flex items-center gap-1 text-sm font-medium text-[#f57c00]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
              {recipe.stats.averageRating.toFixed(1)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
