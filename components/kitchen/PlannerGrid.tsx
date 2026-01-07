"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, PlusCircle } from "lucide-react"

interface PlannerGridProps {
    planData: Record<string, any[]>
    onSlotClick: (day: string, meal: string) => void
    onRemoveItem: (day: string, meal: string, index: number) => void
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"]

export default function PlannerGrid({ planData, onSlotClick, onRemoveItem }: PlannerGridProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="grid grid-cols-8 divide-x divide-gray-200 border-b border-gray-200 bg-gray-50">
                <div className="p-4 font-bold text-gray-400">Meal</div>
                {DAYS.map(day => (
                    <div key={day} className="p-2 text-center font-bold text-gray-700 text-sm md:text-base">
                        {day.slice(0, 3)}
                    </div>
                ))}
            </div>

            <div className="divide-y divide-gray-200">
                {MEALS.map(meal => (
                    <div key={meal} className="grid grid-cols-8 divide-x divide-gray-200 min-h-[120px]">
                        <div className="p-2 md:p-4 bg-gray-50 font-medium text-gray-600 flex items-center justify-center text-xs md:text-sm writing-mode-vertical md:writing-mode-horizontal">
                            {meal}
                        </div>

                        {DAYS.map(day => {
                            const key = `${day}-${meal}`
                            const items = planData[key] || []

                            return (
                                <div key={key} className="p-1 md:p-2 relative group hover:bg-gray-50 transition-colors">
                                    <div className="space-y-2 h-full">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="bg-white border-l-4 border-[#2e7d32] shadow-sm rounded p-1.5 md:p-2 relative text-left">
                                                <p className="font-semibold text-xs truncate">{item.name}</p>
                                                <div className="text-[10px] text-gray-500 flex gap-1">
                                                    {item.caloriesPerServing > 0 && <span>{item.caloriesPerServing} cal</span>}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveItem(day, meal, idx);
                                                    }}
                                                    className="absolute -top-1 -right-1 bg-white rounded-full shadow text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => onSlotClick(day, meal)}
                                            className="w-full py-2 border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 hover:border-[#2e7d32] hover:text-[#2e7d32] transition-colors"
                                        >
                                            <PlusCircle className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
