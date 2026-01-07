"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star } from "lucide-react" // Ensure you have lucide-react installed
import { API_BASE_URL } from "@/lib/api"
import { toast } from "sonner" // Assuming sonner is used for toasts based on package.json

interface CookingAttemptDialogProps {
    targetId: string
    targetName: string
    targetType?: "Recipe" | "Menu"
    onSuccess?: () => void
}

export default function CookingAttemptDialog({
    targetId,
    targetName,
    targetType = "Recipe",
    onSuccess
}: CookingAttemptDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [review, setReview] = useState("")
    const [difficulty, setDifficulty] = useState("Medium")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (rating === 0) {
            toast.error("Please add a rating")
            return
        }

        setLoading(true)

        try {
            const token = localStorage.getItem("token")
            if (!token) {
                toast.error("You must be logged in to post a review")
                return
            }

            const response = await fetch(`${API_BASE_URL}/cooking-attempts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    targetId,
                    targetType,
                    rating,
                    review,
                    difficultyExperienced: difficulty,
                    isPublic: true
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to submit review")
            }

            toast.success("Review submitted successfully!")
            setOpen(false)
            if (onSuccess) onSuccess()

            // Reset form
            setRating(0)
            setReview("")
            setDifficulty("Medium")
        } catch (error) {
            console.error(error)
            toast.error("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#f57c00] hover:bg-[#ef6c00] text-white">
                    Try this {targetType}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>How was the {targetName}?</DialogTitle>
                    <DialogDescription>
                        Share your experience cooking this food. Your feedback helps others!
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-colors"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoverRating || rating)
                                                ? "fill-[#f57c00] text-[#f57c00]"
                                                : "text-gray-300"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="review">Your Review</Label>
                        <Textarea
                            id="review"
                            placeholder="What did you think? Any tips for next time?"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            className="resize-none h-32"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="bg-[#2e7d32] hover:bg-[#1b5e20]">
                            {loading ? "Submitting..." : "Submit Review"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
