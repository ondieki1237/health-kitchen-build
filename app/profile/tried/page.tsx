"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/kitchen/Header"
import { API_BASE_URL } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Star, Utensils, Calendar } from "lucide-react"
import { format } from "date-fns"

interface Attempt {
    _id: string
    targetId: {
        _id: string
        name: string
        thumbnailUrl?: string
    }
    targetType: string
    rating: number
    review?: string
    createdAt: string
    difficultyExperienced?: string
}

export default function TriedRecipesPage() {
    const [attempts, setAttempts] = useState<Attempt[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
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

        fetchAttempts(token)
    }, [router])

    const fetchAttempts = async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/cooking-attempts`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setAttempts(data.attempts || [])
            }
        } catch (error) {
            console.error("Error fetching attempts:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
    }

    return (
        <div className="min-h-screen bg-[#f9faf7]">
            <Header user={user} onLogout={handleLogout} />

            <div className="max-w-4xl mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold text-[#2e7d32] mb-8 flex items-center gap-2">
                    <Utensils className="h-8 w-8" />
                    My Tried Recipes
                </h1>

                {loading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : attempts.length > 0 ? (
                    <div className="space-y-4">
                        {attempts.map((attempt) => (
                            <div
                                key={attempt._id}
                                className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => router.push(`/recipe/${attempt.targetId._id}`)}
                            >
                                {attempt.targetId.thumbnailUrl && (
                                    <img
                                        src={attempt.targetId.thumbnailUrl}
                                        alt={attempt.targetId.name}
                                        className="w-full md:w-48 h-32 object-cover rounded-md"
                                    />
                                )}

                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-xl font-bold text-gray-900">{attempt.targetId.name}</h2>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(attempt.createdAt), "MMM d, yyyy")}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < attempt.rating ? "fill-[#f57c00] text-[#f57c00]" : "text-gray-300"}`}
                                            />
                                        ))}
                                        {attempt.difficultyExperienced && (
                                            <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                {attempt.difficultyExperienced}
                                            </span>
                                        )}
                                    </div>

                                    {attempt.review && (
                                        <p className="text-gray-600 line-clamp-2">{attempt.review}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">You haven't tried any recipes yet</h3>
                        <p className="text-gray-500 mb-6">Start exploring recipes and mark them as tried!</p>
                        <Button onClick={() => router.push("/dashboard")} className="bg-[#2e7d32] hover:bg-[#1b5e20]">
                            Explore Recipes
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
