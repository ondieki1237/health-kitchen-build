export const FOOD_BLOB_MAP: Record<string, { bg: string, text: string, gradient: string, iconColor?: string }> = {
    // Greens (Fresh, Veggies, Salad)
    "salad": { bg: "bg-green-100", text: "text-green-800", gradient: "from-green-100 to-emerald-100", iconColor: "text-green-500" },
    "spinach": { bg: "bg-green-100", text: "text-green-800", gradient: "from-green-100 to-emerald-100", iconColor: "text-green-500" },
    "okra": { bg: "bg-green-100", text: "text-green-800", gradient: "from-green-100 to-lime-100", iconColor: "text-green-500" },
    "vegetable": { bg: "bg-green-50", text: "text-green-700", gradient: "from-green-50 to-teal-50", iconColor: "text-green-400" },
    "vegetarian": { bg: "bg-green-50", text: "text-green-700", gradient: "from-green-50 to-teal-50", iconColor: "text-green-400" },
    "vegan": { bg: "bg-green-50", text: "text-green-700", gradient: "from-green-50 to-teal-50", iconColor: "text-green-400" },
    "pesto": { bg: "bg-green-100", text: "text-green-800", gradient: "from-green-100 to-green-200", iconColor: "text-green-600" },
    "avocado": { bg: "bg-green-100", text: "text-green-800", gradient: "from-green-100 to-emerald-100", iconColor: "text-green-500" },

    // Reds (Tomato, Spicy, Meat)
    "tomato": { bg: "bg-red-50", text: "text-red-800", gradient: "from-red-50 to-rose-100", iconColor: "text-red-500" },
    "spicy": { bg: "bg-red-100", text: "text-red-900", gradient: "from-red-100 to-orange-200", iconColor: "text-red-600" },
    "pizza": { bg: "bg-orange-50", text: "text-orange-900", gradient: "from-orange-50 to-red-100", iconColor: "text-red-500" },
    "beef": { bg: "bg-rose-100", text: "text-rose-900", gradient: "from-rose-100 to-red-200", iconColor: "text-rose-700" },
    "mince": { bg: "bg-rose-100", text: "text-rose-900", gradient: "from-rose-100 to-red-200", iconColor: "text-rose-700" },
    "sausage": { bg: "bg-rose-100", text: "text-rose-900", gradient: "from-rose-100 to-red-200", iconColor: "text-rose-700" },
    "red": { bg: "bg-red-50", text: "text-red-800", gradient: "from-red-50 to-rose-100", iconColor: "text-red-500" },

    // Oranges (Curry, Stew, Root Veg)
    "curry": { bg: "bg-orange-100", text: "text-orange-900", gradient: "from-orange-100 to-amber-200", iconColor: "text-orange-600" },
    "carrot": { bg: "bg-orange-50", text: "text-orange-800", gradient: "from-orange-50 to-orange-100", iconColor: "text-orange-500" },
    "pumpkin": { bg: "bg-orange-100", text: "text-orange-900", gradient: "from-orange-100 to-amber-100", iconColor: "text-orange-600" },
    "butternut": { bg: "bg-orange-100", text: "text-orange-900", gradient: "from-orange-100 to-amber-100", iconColor: "text-orange-600" },
    "soup": { bg: "bg-amber-50", text: "text-amber-900", gradient: "from-amber-50 to-orange-100", iconColor: "text-amber-600" },
    "stew": { bg: "bg-orange-100", text: "text-orange-900", gradient: "from-orange-100 to-red-100", iconColor: "text-orange-700" },
    "lentil": { bg: "bg-amber-100", text: "text-amber-900", gradient: "from-amber-100 to-orange-100", iconColor: "text-amber-700" },
    "samosa": { bg: "bg-yellow-100", text: "text-yellow-900", gradient: "from-yellow-100 to-amber-100", iconColor: "text-amber-600" },

    // Yellows/Creams (Rice, Potato, Pasta, Cheese)
    "rice": { bg: "bg-slate-50", text: "text-slate-800", gradient: "from-slate-50 to-gray-100", iconColor: "text-slate-400" },
    "potato": { bg: "bg-yellow-50", text: "text-yellow-900", gradient: "from-yellow-50 to-amber-50", iconColor: "text-amber-600" },
    "cheese": { bg: "bg-yellow-100", text: "text-yellow-900", gradient: "from-yellow-100 to-orange-50", iconColor: "text-yellow-600" },
    "creamy": { bg: "bg-stone-50", text: "text-stone-800", gradient: "from-stone-50 to-orange-50", iconColor: "text-stone-500" },
    "coconut": { bg: "bg-slate-50", text: "text-slate-800", gradient: "from-slate-50 to-gray-100", iconColor: "text-slate-500" },
    "garlic": { bg: "bg-gray-50", text: "text-gray-800", gradient: "from-gray-50 to-slate-100", iconColor: "text-gray-500" },
    "tofu": { bg: "bg-stone-100", text: "text-stone-800", gradient: "from-stone-100 to-yellow-50", iconColor: "text-stone-600" },
    "oatmeal": { bg: "bg-stone-100", text: "text-stone-800", gradient: "from-stone-100 to-amber-50", iconColor: "text-stone-600" },

    // Browns/Earthy (Mushrooms, Beans, Fried)
    "mushroom": { bg: "bg-stone-200", text: "text-stone-800", gradient: "from-stone-100 to-stone-300", iconColor: "text-stone-600" },
    "beans": { bg: "bg-amber-100", text: "text-amber-900", gradient: "from-amber-100 to-orange-100", iconColor: "text-amber-700" },
    "fried": { bg: "bg-yellow-100", text: "text-yellow-900", gradient: "from-yellow-100 to-orange-100", iconColor: "text-orange-600" },
    "stirfry": { bg: "bg-orange-50", text: "text-orange-900", gradient: "from-orange-50 to-amber-100", iconColor: "text-orange-700" },
    "roasted": { bg: "bg-orange-100", text: "text-orange-900", gradient: "from-orange-100 to-amber-200", iconColor: "text-orange-700" },
    "peanut": { bg: "bg-amber-200", text: "text-amber-900", gradient: "from-amber-100 to-yellow-200", iconColor: "text-amber-700" },
    "groundnut": { bg: "bg-amber-200", text: "text-amber-900", gradient: "from-amber-100 to-yellow-200", iconColor: "text-amber-700" },

    // Purples/Others
    "eggplant": { bg: "bg-purple-100", text: "text-purple-900", gradient: "from-purple-100 to-fuchsia-100", iconColor: "text-purple-600" },
    "berry": { bg: "bg-pink-100", text: "text-pink-900", gradient: "from-pink-100 to-rose-100", iconColor: "text-pink-600" },
};