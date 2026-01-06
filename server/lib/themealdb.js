import axios from "axios";
import Recipe from "../models/Recipe.js";

export class TheMealDBService {
  constructor() {
    this.apiBaseUrl = "https://www.themealdb.com/api/json/v1/1";
    this.apiKey = process.env.THEMEALDB_API_KEY || "1";

    // Non-vegetarian keywords to filter out
    this.nonVegetarianKeywords = [
      "chicken",
      "beef",
      "pork",
      "lamb",
      "fish",
      "salmon",
      "tuna",
      "shrimp",
      "prawn",
      "bacon",
      "ham",
      "meat",
      "turkey",
      "duck",
      "sausage",
      "seafood",
      "crab",
      "lobster",
      "anchovy",
      "clam",
    ];

    // Vegetarian-friendly areas
    this.vegetarianAreas = ["Indian", "Italian", "Mexican", "Thai", "Japanese", "Chinese", "Vietnamese", "Greek"];

    // Vegetarian-friendly categories
    this.vegetarianCategories = ["Vegetarian", "Side", "Pasta", "Dessert", "Breakfast", "Starter"];
  }

  // Helper: sleep function
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Helper: slugify text
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Check if meal is vegetarian
  async isVegetarianMeal(meal) {
    const mealName = meal.strMeal.toLowerCase();

    // Check meal name
    for (const keyword of this.nonVegetarianKeywords) {
      if (mealName.includes(keyword)) {
        return false;
      }
    }

    // Check all ingredients
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      if (ingredient && ingredient.trim()) {
        const ingredientLower = ingredient.toLowerCase();
        for (const keyword of this.nonVegetarianKeywords) {
          if (ingredientLower.includes(keyword)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // Fetch meals by area
  async fetchMealsByArea(area) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/filter.php?a=${area}`);
      return response.data.meals || [];
    } catch (error) {
      console.error(`Error fetching meals from ${area}:`, error);
      return [];
    }
  }

  // Fetch meals by category
  async fetchMealsByCategory(category) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/filter.php?c=${category}`);
      return response.data.meals || [];
    } catch (error) {
      console.error(`Error fetching meals from category ${category}:`, error);
      return [];
    }
  }

  // Fetch full meal details
  async fetchMealDetails(mealId) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/lookup.php?i=${mealId}`);
      return response.data.meals ? response.data.meals[0] : null;
    } catch (error) {
      console.error(`Error fetching meal details for ${mealId}:`, error);
      return null;
    }
  }

  // Store meal in database
  async storeMeal(meal) {
    try {
      // Parse ingredients
      const ingredients = []
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`]
        const measure = meal[`strMeasure${i}`]

        if (ingredient && ingredient.trim()) {
          ingredients.push({
            name: ingredient.trim(),
            quantity: measure?.trim() || "to taste",
          })
        }
      }

      // Parse instructions
      const instructionSteps = meal.strInstructions
        .split(/\r?\n/)
        .filter((s) => s.trim())
        .map((instruction, index) => ({
          stepNumber: index + 1,
          instruction: instruction.trim(),
        }))

      // Check if recipe already exists
      const existingRecipe = await Recipe.findOne({ mealDbId: meal.idMeal })

      if (existingRecipe) {
        console.log(`Recipe already exists: ${meal.strMeal}`)
        return existingRecipe
      }

      // Create new recipe
      const recipe = await Recipe.create({
        mealDbId: meal.idMeal,
        name: meal.strMeal,
        slug: `${this.slugify(meal.strMeal)}-${Date.now()}`,
        category: meal.strCategory,
        cuisine: meal.strCategory,
        area: meal.strArea,
        thumbnailUrl: meal.strMealThumb,
        videoUrl: meal.strYoutube,
        sourceUrl: meal.strSource,
        description: meal.strInstructions.substring(0, 500),
        isVegetarian: true,
        dataSource: "themealdb",
        ingredients,
        instructions: instructionSteps,
        tags: [meal.strCategory, meal.strArea].filter(Boolean),
      })

      console.log(`✅ Stored: ${meal.strMeal}`)
      return recipe
    } catch (error) {
      console.error("Error storing meal:", error)
      throw error
    }
  }

  // Sync meals by area
  async syncMealsByArea(area, limit = 10) {
    let synced = 0
    let skipped = 0

    try {
      console.log(`\n🌍 Syncing meals from ${area}...`)

      // Fetch meals from area
      const meals = await this.fetchMealsByArea(area)
      console.log(`Found ${meals.length} meals from ${area}`)

      // Process meals with limit
      for (const meal of meals.slice(0, limit)) {
        // Fetch full details
        const fullMeal = await this.fetchMealDetails(meal.idMeal)

        if (!fullMeal) {
          skipped++
          continue
        }

        // Check if vegetarian
        if (await this.isVegetarianMeal(fullMeal)) {
          await this.storeMeal(fullMeal)
          synced++
        } else {
          console.log(`⏭️  Skipped (contains meat): ${fullMeal.strMeal}`)
          skipped++
        }

        // Rate limiting: wait 100ms between requests
        await this.sleep(100)
      }

      console.log(`\n✅ Synced ${synced} recipes, skipped ${skipped} from ${area}`)
      return { synced, skipped }
    } catch (error) {
      console.error(`Error syncing meals from ${area}:`, error)
      throw error
    }
  }

  // Sync meals by category
  async syncMealsByCategory(category, limit = 10) {
    let synced = 0
    let skipped = 0

    try {
      console.log(`\n🍽️  Syncing meals from category ${category}...`)

      // Fetch meals from category
      const meals = await this.fetchMealsByCategory(category)
      console.log(`Found ${meals.length} meals from category ${category}`)

      // Process meals with limit
      for (const meal of meals.slice(0, limit)) {
        // Fetch full details
        const fullMeal = await this.fetchMealDetails(meal.idMeal)

        if (!fullMeal) {
          skipped++
          continue
        }

        // Check if vegetarian
        if (await this.isVegetarianMeal(fullMeal)) {
          await this.storeMeal(fullMeal)
          synced++
        } else {
          console.log(`⏭️  Skipped (contains meat): ${fullMeal.strMeal}`)
          skipped++
        }

        // Rate limiting: wait 100ms between requests
        await this.sleep(100)
      }

      console.log(`\n✅ Synced ${synced} recipes, skipped ${skipped} from category ${category}`)
      return { synced, skipped }
    } catch (error) {
      console.error(`Error syncing meals from category ${category}:`, error)
      throw error
    }
  }

  // Sync all vegetarian-friendly areas
  async syncAllAreas(limitPerArea = 10) {
    let totalSynced = 0
    let totalSkipped = 0

    for (const area of this.vegetarianAreas) {
      const result = await this.syncMealsByArea(area, limitPerArea)
      totalSynced += result.synced
      totalSkipped += result.skipped

      // Wait between areas
      await this.sleep(500)
    }

    console.log(`\n🎉 Total synced: ${totalSynced} recipes, skipped: ${totalSkipped}`)
    return { totalSynced, totalSkipped }
  }

  // Search meals by name
  async searchMealsByName(name) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/search.php?s=${name}`)
      return response.data.meals || []
    } catch (error) {
      console.error(`Error searching meals by name ${name}:`, error)
      return []
    }
  }

  // Get random meal
  async getRandomMeal() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/random.php`)
      return response.data.meals ? response.data.meals[0] : null
    } catch (error) {
      console.error("Error getting random meal:", error)
      return null
    }
  }
}

export default new TheMealDBService();

export const syncMealsByArea = (area, limit) => {
  return new TheMealDBService().syncMealsByArea(area, limit);
};

export const syncMealsByCategory = (category, limit) => {
  return new TheMealDBService().syncMealsByCategory(category, limit);
};
