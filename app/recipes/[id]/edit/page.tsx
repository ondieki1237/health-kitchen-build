"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Header from "@/components/kitchen/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Save, ArrowLeft, Loader2, Edit } from "lucide-react"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/api"
import ImageUploader from "@/components/ui/ImageUploader"

export default function EditRecipePage() {
    const router = useRouter()
    const { id } = useParams()
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "Main Course",
        imageUrl: "",
        cuisine: "American",
        cookingTimeMinutes: 30,
        servingSize: 4,
        isVegetarian: false,
        isVegan: false,
        ingredients: [{ name: "", quantity: "", measurementUnit: "" }],
        instructions: [{ stepNumber: 1, instruction: "", timeMinutes: 0 }],
        nutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        }
    })

    useEffect(() => {
        if (id) fetchRecipe()
    }, [id])

    const fetchRecipe = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/recipes/${id}`)
            if (!res.ok) throw new Error("Failed to load recipe")
            const data = await res.json()

            // Map data to form structure (ensure arrays exist)
            setFormData({
                name: data.name || "",
                description: data.description || "",
                category: data.category || "Main Course",
                imageUrl: data.imageUrl || "",
                cuisine: data.cuisine || "American",
                cookingTimeMinutes: data.cookingTimeMinutes || 30,
                servingSize: data.servingSize || 4,
                isVegetarian: data.isVegetarian || false,
                isVegan: data.isVegan || false,
                ingredients: data.ingredients?.length ? data.ingredients : [{ name: "", quantity: "", measurementUnit: "" }],
                instructions: data.instructions?.length ? data.instructions : [{ stepNumber: 1, instruction: "", timeMinutes: 0 }],
                nutrition: {
                    calories: data.nutrition?.calories || 0,
                    protein: data.nutrition?.protein || 0,
                    carbs: data.nutrition?.carbs || 0,
                    fat: data.nutrition?.fat || 0
                }
            })
        } catch (error) {
            console.error(error)
            toast.error("Error loading recipe data")
            router.push("/dashboard")
        } finally {
            setLoading(false)
        }
    }

    const handleIngredientChange = (index: number, field: string, value: string) => {
        const newIngredients = [...formData.ingredients]
        // @ts-ignore
        newIngredients[index][field] = value
        setFormData({ ...formData, ingredients: newIngredients })
    }

    const addIngredient = () => {
        setFormData({
            ...formData,
            ingredients: [...formData.ingredients, { name: "", quantity: "", measurementUnit: "" }]
        })
    }

    const removeIngredient = (index: number) => {
        const newIngredients = [...formData.ingredients]
        newIngredients.splice(index, 1)
        setFormData({ ...formData, ingredients: newIngredients })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) return toast.error("Name is required")

        setSubmitting(true)
        try {
            const token = localStorage.getItem("token")
            if (!token) throw new Error("Not authenticated")

            const res = await fetch(`${API_BASE_URL}/recipes/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error("Failed to update recipe")

            toast.success("Recipe updated successfully!")
            router.push(`/recipe/${id}`)
        } catch (error) {
            console.error(error)
            toast.error("Failed to update recipe")
        } finally {
            setSubmitting(false)
        }
    }

    const cuisines = ["American", "Italian", "Mexican", "Asian", "Indian", "Mediterranean", "French", "Other"]
    const categories = ["Breakfast", "Main Course", "Side Dish", "Snack", "Dessert", "Drink"]

    if (loading) return <div className="text-center py-20">Loading...</div>

    return (
        <div className="min-h-screen bg-[#f9faf7]">
            <Header user={null} onLogout={() => { }} />

            <main className="max-w-4xl mx-auto p-6 md:p-8">
                <Button variant="ghost" className="mb-6 gap-2 text-gray-600 hover:text-green-700" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                    <h1 className="text-3xl font-bold text-[#2e7d32] mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                            <Edit className="h-6 w-6" />
                        </span>
                        Edit Recipe
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section: Basic Info */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Recipe Name <span className="text-red-500">*</span></label>
                                    <Input
                                        placeholder="e.g. Grandma's Apple Pie"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Recipe Image</label>
                                    {formData.imageUrl ? (
                                        <div className="relative group w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, imageUrl: "" })}
                                                className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-sm hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <ImageUploader
                                            onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })}
                                            className="h-48"
                                            buttonLabel="Click to upload cover photo"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Description</label>
                                    <Textarea
                                        placeholder="Briefly describe your recipe..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="h-24"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Cuisine</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={formData.cuisine}
                                        onChange={e => setFormData({ ...formData, cuisine: e.target.value })}
                                    >
                                        {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Cooking Time (minutes)</label>
                                    <Input
                                        type="number"
                                        value={formData.cookingTimeMinutes}
                                        onChange={e => setFormData({ ...formData, cookingTimeMinutes: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Ingredients */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 flex justify-between items-center">
                                Ingredients
                                <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="text-green-700 border-green-200 hover:bg-green-50">
                                    <Plus className="w-4 h-4 mr-1" /> Add Item
                                </Button>
                            </h2>
                            <div className="space-y-3">
                                {formData.ingredients.map((ing, idx) => (
                                    <div key={idx} className="flex gap-3 items-start">
                                        <Input
                                            placeholder="Ingredient name"
                                            value={ing.name}
                                            onChange={e => handleIngredientChange(idx, "name", e.target.value)}
                                            className="flex-1"
                                        />
                                        <Input
                                            placeholder="Qty"
                                            value={ing.quantity}
                                            onChange={e => handleIngredientChange(idx, "quantity", e.target.value)}
                                            className="w-24"
                                        />
                                        <div className="pt-1">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Instructions */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 flex justify-between items-center">
                                Instructions
                                <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, instructions: [...formData.instructions, { stepNumber: formData.instructions.length + 1, instruction: "", timeMinutes: 0 }] })} className="text-green-700 border-green-200 hover:bg-green-50">
                                    <Plus className="w-4 h-4 mr-1" /> Add Step
                                </Button>
                            </h2>
                            <div className="space-y-4">
                                {formData.instructions.map((step, idx) => (
                                    <div key={idx} className="flex gap-3 items-start">
                                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold flex-shrink-0 mt-2">
                                            {idx + 1}
                                        </div>
                                        <Textarea
                                            placeholder={`Step ${idx + 1} instructions...`}
                                            value={typeof step === 'string' ? step : step.instruction}
                                            onChange={e => {
                                                const newInst = [...formData.instructions]
                                                // Handle legacy string instructions if any, though we prefer objects
                                                const currentStep = newInst[idx]
                                                newInst[idx] = typeof currentStep === 'string'
                                                    ? { stepNumber: idx + 1, instruction: e.target.value, timeMinutes: 0 }
                                                    : { ...currentStep, instruction: e.target.value }
                                                setFormData({ ...formData, instructions: newInst })
                                            }}
                                            className="flex-1 min-h-[80px]"
                                        />
                                        <div className="pt-2">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => {
                                                const newInst = [...formData.instructions]
                                                newInst.splice(idx, 1)
                                                setFormData({ ...formData, instructions: newInst })
                                            }} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Nutrition */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Nutrition (Per Serving)</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Calories</label>
                                    <Input
                                        type="number"
                                        value={formData.nutrition.calories}
                                        onChange={e => setFormData({ ...formData, nutrition: { ...formData.nutrition, calories: parseInt(e.target.value) } })}
                                        className="h-12 text-lg font-semibold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Protein (g)</label>
                                    <Input
                                        type="number"
                                        value={formData.nutrition.protein}
                                        onChange={e => setFormData({ ...formData, nutrition: { ...formData.nutrition, protein: parseInt(e.target.value) } })}
                                        className="h-12 text-lg text-blue-700"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Carbs (g)</label>
                                    <Input
                                        type="number"
                                        value={formData.nutrition.carbs}
                                        onChange={e => setFormData({ ...formData, nutrition: { ...formData.nutrition, carbs: parseInt(e.target.value) } })}
                                        className="h-12 text-lg text-orange-700"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Fat (g)</label>
                                    <Input
                                        type="number"
                                        value={formData.nutrition.fat}
                                        onChange={e => setFormData({ ...formData, nutrition: { ...formData.nutrition, fat: parseInt(e.target.value) } })}
                                        className="h-12 text-lg text-yellow-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={submitting} className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white min-w-[150px]">
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                {submitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
