"use client"

import { useState, useEffect } from "react"
import Header from "@/components/kitchen/Header"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Save, Calendar as CalendarIcon, Activity } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import RecipeSelector from "@/components/kitchen/RecipeSelector"
import PlannerGrid from "@/components/kitchen/PlannerGrid"

interface Recipe {
    _id: string
    name: string
    caloriesPerServing?: number
    stats?: any
    nutrition?: {
        protein: number
        carbs: number
        fat: number
        calories: number
    }
}

export default function PlannerPage() {
    const [user, setUser] = useState<any>(null)
    const router = useRouter()
    const [planData, setPlanData] = useState<Record<string, Recipe[]>>({})
    const [selectedSlot, setSelectedSlot] = useState<{ day: string, meal: string } | null>(null)
    const [selectorOpen, setSelectorOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Weekly Stats
    const [stats, setStats] = useState({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    })

    // Day Details
    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const [dayDetailsOpen, setDayDetailsOpen] = useState(false)
    const [dayStats, setDayStats] = useState({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    })

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

        fetchWeeklyPlan(token)
    }, [router])

    // Recalculate stats whenever planData changes
    useEffect(() => {
        let cal = 0, pro = 0, carb = 0, fat = 0;

        Object.values(planData).forEach(recipes => {
            recipes.forEach(r => {
                cal += r.caloriesPerServing || r.nutrition?.calories || 0;
                pro += r.nutrition?.protein || 0;
                carb += r.nutrition?.carbs || 0;
                fat += r.nutrition?.fat || 0;
            })
        })

        setStats({
            calories: Math.round(cal),
            protein: Math.round(pro),
            carbs: Math.round(carb),
            fat: Math.round(fat)
        })
    }, [planData])

    const fetchWeeklyPlan = async (token: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/menus/weekly`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (data && data.meals) {
                    const mapped: Record<string, Recipe[]> = {};
                    data.meals.forEach((m: any) => {
                        const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][m.day % 7];
                        // Note: Day 0/7 might need adjustment depending on backend (1-7 usually)
                        // Assuming backend 1=Mon, 7=Sun for simplicity in this map or direct string match if stored like that.
                        // Or simplified: let's rely on the structure we build.

                        // Correction: The backend Menu model uses day numbers 1-7.
                        const daysMap = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                        const d = daysMap[m.day];

                        const mealName = m.mealTime.charAt(0).toUpperCase() + m.mealTime.slice(1);
                        const key = `${d}-${mealName}`;

                        if (!mapped[key]) mapped[key] = [];
                        if (m.recipe) mapped[key].push(m.recipe);
                    });
                    setPlanData(mapped);
                }
            }
        } catch (e) {
            console.error("Failed to load plan", e)
        }
    }

    const handleSlotClick = (day: string, meal: string) => {
        setSelectedSlot({ day, meal })
        setSelectorOpen(true)
    }

    const addRecipe = (recipe: Recipe) => {
        if (!selectedSlot) return;

        const key = `${selectedSlot.day}-${selectedSlot.meal}`;
        setPlanData(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), recipe]
        }))
        setSelectorOpen(false)
        toast.success(`Added ${recipe.name} to ${selectedSlot.day} ${selectedSlot.meal}`)
    }

    const removeRecipe = (day: string, meal: string, index: number) => {
        const key = `${day}-${meal}`;
        setPlanData(prev => {
            const newList = [...(prev[key] || [])];
            newList.splice(index, 1);
            return { ...prev, [key]: newList };
        })
    }

    const handleDayClick = (day: string) => {
        setSelectedDay(day);

        // Calculate Day Stats
        let cal = 0, pro = 0, carb = 0, fat = 0;
        const meals = ["Breakfast", "Lunch", "Dinner", "Snack"];

        meals.forEach(meal => {
            const key = `${day}-${meal}`;
            const recipes = planData[key] || [];
            recipes.forEach(r => {
                cal += r.caloriesPerServing || r.nutrition?.calories || 0;
                pro += r.nutrition?.protein || 0;
                carb += r.nutrition?.carbs || 0;
                fat += r.nutrition?.fat || 0;
            });
        });

        setDayStats({
            calories: Math.round(cal),
            protein: Math.round(pro),
            carbs: Math.round(carb),
            fat: Math.round(fat)
        });

        setDayDetailsOpen(true);
    }

    const savePlan = async () => {
        setSaving(true)
        try {
            // Convert easy map structure back to backend array
            const mealsArray: any[] = [];
            const daysMap: Record<string, number> = {
                "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7
            };

            Object.entries(planData).forEach(([key, recipes]) => {
                const [dayStr, mealStr] = key.split('-');
                const day = daysMap[dayStr];
                const mealTime = mealStr.toLowerCase();

                recipes.forEach(r => {
                    mealsArray.push({
                        day,
                        mealTime,
                        recipe: r._id,
                        servings: 1
                    });
                });
            });

            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/menus/weekly`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ meals: mealsArray })
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success("Weekly plan saved successfully!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to save plan");
        } finally {
            setSaving(false)
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

            <main className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Main Planner Grid */}
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-[#2e7d32] flex items-center gap-2">
                                    <CalendarIcon className="h-8 w-8" />
                                    Weekly Kitchen Planner
                                </h1>
                                <p className="text-gray-600 mt-1">Plan your meals for the week ahead</p>
                            </div>

                            <Button onClick={savePlan} disabled={saving} className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white gap-2">
                                <Save className="h-4 w-4" />
                                {saving ? "Saving..." : "Save Plan"}
                            </Button>
                        </div>

                        <PlannerGrid
                            planData={planData}
                            onSlotClick={handleSlotClick}
                            onRemoveItem={removeRecipe}
                            onDayClick={handleDayClick}
                        />
                    </div>

                    {/* Nutrition Dashboard Sidebar */}
                    <div className="w-full lg:w-80 bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-24 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-[#f57c00]" />
                            Weekly Nutrition
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                <p className="text-sm text-gray-500 mb-1">Total Calories</p>
                                <p className="text-3xl font-bold text-[#2e7d32]">{stats.calories}</p>
                                <p className="text-xs text-green-700 mt-1">kcal for the week</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Protein</span>
                                        <span className="font-semibold">{stats.protein}g</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Carbs</span>
                                        <span className="font-semibold">{stats.carbs}g</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Fat</span>
                                        <span className="font-semibold">{stats.fat}g</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: '30%' }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400 text-center italic">
                                    Values are estimates based on available recipe data.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Dialog open={selectorOpen} onOpenChange={setSelectorOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Select Recipe for {selectedSlot?.day} {selectedSlot?.meal}</DialogTitle>
                    </DialogHeader>
                    <RecipeSelector onSelect={addRecipe} />
                </DialogContent>
            </Dialog>

            <Dialog open={dayDetailsOpen} onOpenChange={setDayDetailsOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-[#2e7d32]">
                            <CalendarIcon className="h-6 w-6" />
                            {selectedDay} Details
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4">
                        {/* Daily Summary */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6 flex flex-wrap gap-4 justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500">Daily Calories</p>
                                <p className="text-2xl font-bold text-[#2e7d32]">{dayStats.calories} <span className="text-sm font-normal text-gray-600">kcal</span></p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Protein</p>
                                    <p className="font-semibold text-blue-700">{dayStats.protein}g</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Carbs</p>
                                    <p className="font-semibold text-orange-700">{dayStats.carbs}g</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Fat</p>
                                    <p className="font-semibold text-yellow-700">{dayStats.fat}g</p>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown by Meal */}
                        <div className="space-y-6">
                            {["Breakfast", "Lunch", "Dinner", "Snack"].map(meal => {
                                const key = `${selectedDay}-${meal}`;
                                const recipes = planData[key] || [];

                                if (recipes.length === 0) return null;

                                return (
                                    <div key={meal} className="border-b border-gray-100 pb-4 last:border-0">
                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="w-1 h-5 rounded-full bg-[#2e7d32]"></span>
                                            {meal}
                                        </h3>
                                        <div className="space-y-3 pl-3">
                                            {recipes.map((r, idx) => (
                                                <div key={idx} className="flex justify-between items-start group">
                                                    <div>
                                                        <p className="text-gray-900 font-medium">{r.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {r.caloriesPerServing || r.nutrition?.calories} kcal •
                                                            P: {r.nutrition?.protein}g • C: {r.nutrition?.carbs}g • F: {r.nutrition?.fat}g
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}

                            {/* If empty */}
                            {["Breakfast", "Lunch", "Dinner", "Snack"].every(m => !planData[`${selectedDay}-${m}`] || planData[`${selectedDay}-${m}`].length === 0) && (
                                <p className="text-center text-gray-500 italic py-8">No meals planned for {selectedDay}.</p>
                            )}
                        </div>

                        {/* Educational / Motivational Tip */}
                        <div className="mt-6 bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
                            <Activity className="h-5 w-5 shrink-0" />
                            <div>
                                <p className="font-semibold mb-1">Did you know?</p>
                                <p>Planning your meals ahead can help reduce food waste and save money, while ensuring you meet your nutritional goals!</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
