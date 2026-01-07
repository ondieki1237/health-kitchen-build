"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Users, Star, Calendar, ChefHat, Upload, Image as ImageIcon, Send, Heart } from "lucide-react"
import { Loader2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function MenuDetailPage() {
  const params = useParams()
  const [menu, setMenu] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState("")
  const [commentRating, setCommentRating] = useState(0)
  const [commentImage, setCommentImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchMenu()
    fetchComments()
  }, [params.id])

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/menus/${params.id}`)
      const data = await response.json()
      setMenu(data)
    } catch (error) {
      console.error("Error fetching menu:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/comments?targetId=${params.id}&targetType=Menu`)
      const data = await response.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCommentImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "haven_furniture")

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    )

    const data = await response.json()
    return data.secure_url
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast({
        title: "Error",
        description: "Please write a review",
        variant: "destructive",
      })
      return
    }

    setSubmittingComment(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Error",
          description: "Please login to leave a review",
          variant: "destructive",
        })
        return
      }

      let imageUrl = null
      if (commentImage) {
        imageUrl = await uploadImageToCloudinary(commentImage)
      }

      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetId: params.id,
          targetType: "Menu",
          content: commentText,
          rating: commentRating || undefined,
          userPhoto: imageUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit review")
      }

      toast({
        title: "Success",
        description: "Review posted successfully!",
      })

      setCommentText("")
      setCommentRating(0)
      setCommentImage(null)
      setImagePreview(null)
      fetchComments()
      fetchMenu() // Refresh to update stats
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      await fetch(`${API_BASE_URL}/comments/${commentId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      fetchComments()
    } catch (error) {
      console.error("Error liking comment:", error)
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

      {/* Reviews Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Reviews & Comments</CardTitle>
          <CardDescription>Share your experience with this menu</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Write Review Form */}
          <div className="mb-8 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            
            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setCommentRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= commentRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Text */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                placeholder="Share your thoughts about this menu..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
              />
            </div>

            {/* Image Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Add Photo (Optional)</label>
              <div className="flex gap-4 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded" />
                    <button
                      onClick={() => {
                        setCommentImage(null)
                        setImagePreview(null)
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button onClick={handleSubmitComment} disabled={submittingComment}>
              {submittingComment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Review
                </>
              )}
            </Button>
          </div>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No reviews yet. Be the first to review this menu!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="border-b pb-6 last:border-0">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={comment.user?.avatar} />
                      <AvatarFallback>
                        {comment.user?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {comment.user?.displayName || comment.user?.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {comment.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(comment.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm">{comment.content}</p>
                      {comment.userPhoto && (
                        <img
                          src={comment.userPhoto}
                          alt="Review photo"
                          className="mt-3 rounded-lg max-w-xs max-h-64 object-cover"
                        />
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => handleLikeComment(comment._id)}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              comment.likedBy?.includes(localStorage.getItem("userId") || "")
                                ? "fill-red-500 text-red-500"
                                : ""
                            }`}
                          />
                          {comment.likes || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
