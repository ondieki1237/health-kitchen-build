import fs from "fs"
import path from "path"

// Read the JSON file
const jsonPath = path.join(process.cwd(), "recipes.json")
const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))

// Function to generate image query based on recipe name and keywords
function generateImageQuery(name, category, isVegan, isVegetarian) {
  const keywords = []

  // Extract main ingredients from name
  const nameLower = name.toLowerCase()
  if (nameLower.includes("soup")) keywords.push("soup")
  if (nameLower.includes("stew")) keywords.push("stew")
  if (nameLower.includes("rice")) keywords.push("rice")
  if (nameLower.includes("okra")) keywords.push("okra")
  if (nameLower.includes("chickpea")) keywords.push("chickpea")
  if (nameLower.includes("egusi")) keywords.push("melon seed soup")
  if (nameLower.includes("nigerian")) keywords.push("Nigerian food")
  if (nameLower.includes("moroccan")) keywords.push("Moroccan food")
  if (nameLower.includes("indonesian")) keywords.push("Indonesian food")
  if (nameLower.includes("spiced") || nameLower.includes("spicy")) keywords.push("spiced")

  // Add cuisine
  if (nameLower.includes("nigerian")) keywords.push("West African")
  if (nameLower.includes("moroccan")) keywords.push("North African")
  if (nameLower.includes("indonesian")) keywords.push("Asian")

  // Add meal type
  keywords.push(category)

  // Add dietary info
  if (isVegan) keywords.push("vegan")
  if (isVegetarian) keywords.push("vegetarian")

  return keywords.slice(0, 3).join(", ") + " dish"
}

// Process each recipe and add image URL
const updatedData = data.map((recipe) => {
  const imageQuery = generateImageQuery(recipe.name, recipe.category, recipe.isVegan, recipe.isVegetarian)

  // Generate placeholder image URL with description
  const imageUrl = `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(imageQuery)}`

  return {
    ...recipe,
    imageUrl, // Added imageUrl field for each recipe
    imageAlt: recipe.name,
  }
})

// Write updated data to new file
const outputPath = path.join(process.cwd(), "recipes-with-images.json")
fs.writeFileSync(outputPath, JSON.stringify(updatedData, null, 2))

console.log(`[v0] Processed ${updatedData.length} recipes`)
console.log(`[v0] Image URLs added to each recipe`)
console.log(`[v0] Output saved to: recipes-with-images.json`)
console.log(`[v0] Sample recipe:`, {
  name: updatedData[0].name,
  imageUrl: updatedData[0].imageUrl,
  imageAlt: updatedData[0].imageAlt,
})
