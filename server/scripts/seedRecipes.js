import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Recipe from "../models/Recipe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/health-kitchen");
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

// Parse ingredients from array
const parseIngredients = (ingredientsArray) => {
  if (!ingredientsArray || ingredientsArray.length === 0) return [];
  
  return ingredientsArray
    .filter(item => item && typeof item === 'string' && item.trim().length > 0)
    .filter(item => !item.startsWith("_") && !item.includes("Media omitted"))
    .map(item => {
      const cleaned = item.trim();
      // Try to extract quantity and unit
      const match = cleaned.match(/^([\d\/\.\s]+)?\s*([a-zA-Z]+)?\s*(.+)$/);
      
      if (match) {
        const [, quantity, unit, name] = match;
        return {
          name: (name || cleaned).trim(),
          quantity: quantity ? quantity.trim() : "",
          measurementUnit: unit && unit.length < 15 ? unit : "",
          notes: ""
        };
      }
      
      return {
        name: cleaned,
        quantity: "",
        measurementUnit: "",
        notes: ""
      };
    });
};

// Parse instructions from array
const parseInstructions = (ingredientsArray) => {
  if (!ingredientsArray || ingredientsArray.length === 0) return [];
  
  // Look for instruction-like items (sentences with periods, starting with verbs, etc.)
  const instructions = ingredientsArray
    .filter(item => item && typeof item === 'string' && item.trim().length > 30) // Instructions are usually longer
    .filter(item => 
      item.includes(".") || 
      item.match(/^(Add|Mix|Cook|Stir|Pour|Heat|Bake|Preheat|In a|Remove|Serve|Let|Bring|Drain|Saute|Transfer|Sprinkle|Cover|After|Allow)/i)
    )
    .map((instruction, index) => ({
      stepNumber: index + 1,
      instruction: instruction.trim(),
      timeMinutes: null
    }));
  
  return instructions;
};

// Extract cooking time from ingredients/instructions
const extractCookingTime = (ingredientsArray) => {
  if (!ingredientsArray) return null;
  
  const timePattern = /(\d+)\s*(minutes?|mins?|hours?|hrs?)/gi;
  let totalMinutes = 0;
  
  for (const item of ingredientsArray) {
    const matches = item.matchAll(timePattern);
    for (const match of matches) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      if (unit.includes("hour") || unit.includes("hr")) {
        totalMinutes += value * 60;
      } else {
        totalMinutes += value;
      }
    }
  }
  
  return totalMinutes > 0 ? totalMinutes : null;
};

// Extract difficulty level
const extractDifficulty = (ingredientsArray) => {
  const ingredientCount = ingredientsArray ? ingredientsArray.filter(i => typeof i === 'string' && !i.startsWith("_")).length : 0;
  
  if (ingredientCount < 8) return "Easy";
  if (ingredientCount < 15) return "Medium";
  return "Hard";
};

// Main seeding function
const seedRecipes = async () => {
  try {
    await connectDB();

    // Read the JSON file
    const jsonPath = path.join(__dirname, "../../vegetarian_recipes.json");
    const fileContent = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(fileContent);

    console.log(`📚 Found ${data.recipes.length} recipes to import`);

    // Clear existing recipes (optional - comment out if you want to keep existing ones)
    // await Recipe.deleteMany({ dataSource: "imported" });
    // console.log("🗑️  Cleared existing imported recipes");

    let imported = 0;
    let skipped = 0;

    for (const recipe of data.recipes) {
      try {
        // Skip recipes with no meaningful data
        if (!recipe.name || recipe.name.includes("Welcome to") || recipe.ingredients.length === 0) {
          skipped++;
          continue;
        }

        const slug = generateSlug(recipe.name);
        
        // Check if recipe already exists
        const existingRecipe = await Recipe.findOne({ slug });
        if (existingRecipe) {
          console.log(`⏭️  Skipping duplicate: ${recipe.name}`);
          skipped++;
          continue;
        }

        const ingredients = parseIngredients(recipe.ingredients);
        const instructions = parseInstructions(recipe.ingredients);
        const cookingTime = extractCookingTime(recipe.ingredients);
        const difficulty = extractDifficulty(ingredients);

        // Create recipe document
        const recipeDoc = new Recipe({
          name: recipe.name,
          slug,
          category: recipe.category || "Main Dish",
          cuisine: recipe.cuisine || "International",
          isVegetarian: true,
          isVegan: false,
          ingredients,
          instructions: instructions.length > 0 ? instructions : [
            { stepNumber: 1, instruction: recipe.notes || "Follow traditional preparation methods." }
          ],
          description: recipe.notes && recipe.notes.length < 500 ? recipe.notes : "",
          cookingTimeMinutes: cookingTime,
          difficultyLevel: difficulty,
          servingSize: 4,
          dataSource: "imported",
          tags: ["vegetarian", recipe.category?.toLowerCase(), recipe.cuisine?.toLowerCase()].filter(Boolean)
        });

        await recipeDoc.save();
        imported++;
        console.log(`✅ Imported: ${recipe.name}`);
      } catch (error) {
        console.error(`❌ Error importing "${recipe.name}":`, error.message);
        skipped++;
      }
    }

    console.log(`\n🎉 Import complete!`);
    console.log(`✅ Successfully imported: ${imported} recipes`);
    console.log(`⏭️  Skipped: ${skipped} recipes`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

// Run the seeder
seedRecipes();
