import fs from "fs"

// Full recipe data with image queries
const recipes = [
  {
    _id: { $oid: "695e55d5bfbf7706c65cc09f" },
    name: "Nigerian Egusi Okra Soup",
    slug: "nigerian-egusi-okra-soup-1767790035677",
    category: "Main Dish",
    isVegan: false,
    isVegetarian: true,
    servingSize: 4,
    dataSource: "manual",
    imageUrl: "/nigerian-okra-melon-seed-soup--west-african-main-d.jpg",
    imageAlt: "Nigerian Egusi Okra Soup",
  },
  {
    _id: { $oid: "695e55d5bfbf7706c65cc0b2" },
    name: "Moroccan Chickpea and Okra Stew",
    slug: "moroccan-chickpea-and-okra-stew-1767790035677",
    category: "Main Dish",
    isVegan: false,
    isVegetarian: true,
    servingSize: 4,
    dataSource: "manual",
    imageUrl: "/moroccan-chickpea-okra-stew--north-african-main-di.jpg",
    imageAlt: "Moroccan Chickpea and Okra Stew",
  },
  {
    _id: { $oid: "695e55d5bfbf7706c65cc0d5" },
    name: "Indonesian Spiced Rice",
    slug: "indonesian-spiced-rice-1767790035677",
    category: "Main Dish",
    isVegan: false,
    isVegetarian: true,
    servingSize: 4,
    dataSource: "manual",
    imageUrl: "/indonesian-spiced-rice--asian-main-dish.jpg",
    imageAlt: "Indonesian Spiced Rice",
  },
  {
    _id: { $oid: "695e55d5bfbf7706c65cc0ea" },
    name: "Spicy Yellow Rice",
    slug: "spicy-yellow-rice-1767790035677",
    category: "Main Dish",
    isVegan: false,
    isVegetarian: true,
    servingSize: 4,
    dataSource: "manual",
    imageUrl: "/spicy-yellow-turmeric-rice--vegetarian-main-dish.jpg",
    imageAlt: "Spicy Yellow Rice",
  },
]

// Write to JSON file
const outputPath = "recipes-with-images.json"
fs.writeFileSync(outputPath, JSON.stringify(recipes, null, 2))

console.log("[v0] Successfully processed 4 recipes")
console.log("[v0] Added imageUrl field with descriptive queries")
console.log("[v0] Added imageAlt field for accessibility")
console.log(`[v0] Output saved to: ${outputPath}`)
console.log("[v0] Sample recipe with image:")
console.log(JSON.stringify(recipes[0], null, 2))
