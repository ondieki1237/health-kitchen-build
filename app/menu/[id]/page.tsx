"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Users, Star, Calendar, ChefHat } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function MenuDetailPage() {
  const params = useParams()
  const [menu, setMenu] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenu()
  }, [params.id])

  const fetchMenu = async () => {
    try {
      const response = await fetch(`/api/menus/${params.id}`)
      const data = await response.json()
      setMenu(data)
    } catch (error) {
      console.error("Error fetching menu:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Menu not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const groupedMeals = menu.meals.reduce((acc: any, meal: any) => {
    if (!acc[meal.mealTime]) {
      acc[meal.mealTime] = []
    }
    acc[meal.mealTime].push(meal)
    return acc
  }, {})

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        {menu.coverImage && (
          <div className="w-full h-64 rounded-lg overflow-hidden mb-4">
            <img src={menu.coverImage} alt={menu.name} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-4xl font-bold mb-2">{menu.name}</h1>
        <p className="text-muted-foreground mb-4">{menu.description}</p>

        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant="secondary">{menu.type}</Badge>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{menu.totalCookingTime || "?"} min total</span>
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="h-4 w-4" />
            <span className="text-sm">{menu.meals.length} meals</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{menu.stats.averageRating.toFixed(1)} ({menu.stats.totalRatings})</span>
          </div>
        </div>

        {menu.tags && menu.tags.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {menu.tags.map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Creator Info */}
        {menu.createdBy && (
          <div className="flex items-center gap-3 mt-4">
            <Avatar>
              <AvatarImage src={menu.createdBy.avatar} />
              <AvatarFallback>{menu.createdBy.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{menu.createdBy.displayName || menu.createdBy.username}</p>
              <p className="text-xs text-muted-foreground">Menu creator</p>
            </div>
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* Meals by Time */}
      <div className="grid gap-6">
        <h2 className="text-2xl font-bold">Meals</h2>

        {Object.entries(groupedMeals).map(([mealTime, meals]: [string, any]) => (
          <Card key={mealTime}>
            <CardHeader>
              <CardTitle className="capitalize">{mealTime}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {meals.map((meal: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      {meal.recipe.thumbnailUrl && (
                        <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                          <img
                            src={meal.recipe.thumbnailUrl}
                            alt={meal.recipe.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <h4 className="font-semibold mb-1">{meal.recipe.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {meal.recipe.cookingTimeMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {meal.recipe.cookingTimeMinutes} min
                          </span>
                        )}
                        {meal.servings && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {meal.servings}
                          </span>
                        )}
                      </div>
                      {meal.notes && <p className="text-xs text-muted-foreground mt-2">{meal.notes}</p>}
                      <Button asChild size="sm" variant="outline" className="w-full mt-3">
                        <a href={`/recipe/${meal.recipe._id}`}>View Recipe</a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Menu Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{menu.stats.views}</p>
              <p className="text-sm text-muted-foreground">Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{menu.stats.favorites}</p>
              <p className="text-sm text-muted-foreground">Favorites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{menu.stats.tried}</p>
              <p className="text-sm text-muted-foreground">Times Tried</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{menu.stats.commentsCount}</p>
              <p className="text-sm text-muted-foreground">Comments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
