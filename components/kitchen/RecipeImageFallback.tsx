"use client"

import { useMemo } from "react"
import { Utensils } from "lucide-react"
import { FOOD_BLOB_MAP } from "@/lib/foodBlobs"

interface RecipeImageFallbackProps {
    name: string
    className?: string
    textClassName?: string
}

// Generate a deterministic number from a string
const hashCode = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return hash
}

// Fallback palette for unmatched items
const FALLBACK_PALETTES = [
    { bg: "bg-orange-100", text: "text-orange-600", gradient: "from-orange-100 to-amber-100", iconColor: "text-orange-400" },
    { bg: "bg-green-100", text: "text-green-600", gradient: "from-green-100 to-emerald-100", iconColor: "text-green-400" },
    { bg: "bg-blue-100", text: "text-blue-600", gradient: "from-blue-100 to-cyan-100", iconColor: "text-blue-400" },
    { bg: "bg-purple-100", text: "text-purple-600", gradient: "from-purple-100 to-fuchsia-100", iconColor: "text-purple-400" },
]

const getStyleAndKeyByName = (name: string) => {
    const lowerName = name.toLowerCase()

    // Check against our map
    for (const [key, style] of Object.entries(FOOD_BLOB_MAP)) {
        if (lowerName.includes(key)) {
            return { style, blobKey: key }
        }
    }

    // Default hash based
    const index = Math.abs(hashCode(name)) % FALLBACK_PALETTES.length
    return { style: FALLBACK_PALETTES[index], blobKey: null }
}

export default function RecipeImageFallback({ name, className = "", textClassName = "" }: RecipeImageFallbackProps) {
    const { style, blobKey } = useMemo(() => getStyleAndKeyByName(name), [name])

    return (
        <div className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br ${style.gradient} ${className}`}>
            {/* Render Blob SVG if match found */}
            {blobKey ? (
                <img
                    src={`/blobs/${blobKey}-blob.svg`}
                    alt=""
                    className="absolute w-[120%] h-[120%] object-cover opacity-60 mix-blend-multiply pointer-events-none"
                />
            ) : (
                <>
                    <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-white/20 rounded-full blur-2xl" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/30 rounded-full blur-xl" />
                </>
            )}

            <div className={`z-10 flex flex-col items-center gap-2 p-4 text-center ${style.text} ${textClassName}`}>
                <Utensils className={`w-8 h-8 opacity-70 ${style.iconColor}`} />
                <span className="font-bold text-lg md:text-xl leading-tight line-clamp-2 drop-shadow-sm">
                    {name}
                </span>
            </div>
        </div>
    )
}
