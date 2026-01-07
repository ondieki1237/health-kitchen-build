"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Recipe {
    _id: string
    name: string
    imageUrl?: string
    cookingTimeMinutes?: number
    caloriesPerServing?: number
    stats?: {
        averageRating: number
    }
}

interface RecipeSelectorProps {
    onSelect: (recipe: Recipe) => void
}

export default function RecipeSelector({ onSelect }: RecipeSelectorProps) {
    const [query, setQuery] = useState("")
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(false)
    const [debouncedQuery, setDebouncedQuery] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 500)
        return () => clearTimeout(timer)
    }, [query])

    useEffect(() => {
        searchRecipes()
    }, [debouncedQuery])

    const searchRecipes = async () => {
        if (!debouncedQuery) {
            setRecipes([]);
            return;
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/recipes?search=${debouncedQuery}&limit=10`)
            const data = await res.json()
            setRecipes(data.recipes || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-2">Add to this slot</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search recipes..."
                        className="pl-9"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 p-2">
                {loading ? (
                    <div className="text-center py-4 text-gray-500">Searching...</div>
                ) : recipes.length > 0 ? (
                    <div className="space-y-2">
                        {recipes.map((recipe) => (
                            <div
                                key={recipe._id}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer group"
                                onClick={() => onSelect(recipe)}
                            >
                                <div className="h-12 w-12 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                                    {recipe.imageUrl && <img src={recipe.imageUrl} alt="" className="h-full w-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{recipe.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {recipe.caloriesPerServing && <span>{recipe.caloriesPerServing} kcal</span>}
                                        {recipe.cookingTimeMinutes && <span>{recipe.cookingTimeMinutes}m</span>}
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : debouncedQuery ? (
                    <div className="text-center py-4 text-gray-500 text-sm">No recipes found</div>
                ) : (
                    <div className="text-center py-12 text-gray-400 text-sm">
                        Type to search for recipes to add to your plan
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
