import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Recipe from '../models/Recipe.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health-kitchen');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Main seeding function
const seedCleanedData = async () => {
  try {
    await connectDB();

    // Read the cleaned JSON files
    const spicesPath = path.join(__dirname, '../spices.json');
    const ingredientsPath = path.join(__dirname, '../ingredients.json');

    console.log('📖 Reading cleaned data files...');
    const spicesData = JSON.parse(fs.readFileSync(spicesPath, 'utf-8'));
    const ingredientsData = JSON.parse(fs.readFileSync(ingredientsPath, 'utf-8'));

    console.log(`\n📊 Data Overview:`);
    console.log(`   Recipes (spices.json): ${spicesData.length}`);
    console.log(`   Ingredients (ingredients.json): ${ingredientsData.length}`);

    // OPTIONAL: Clear existing imported/dirty data
    // Uncomment the lines below if you want to remove old data before importing
    console.log('\n🗑️  Clearing existing imported recipes...');
    const deleteResult = await Recipe.deleteMany({ dataSource: 'imported' });
    console.log(`   Deleted ${deleteResult.deletedCount} old recipes`);

    // Group ingredients by recipeId
    console.log('\n🔗 Grouping ingredients by recipe...');
    const ingredientsByRecipe = {};
    for (const ingredient of ingredientsData) {
      if (!ingredientsByRecipe[ingredient.recipeId]) {
        ingredientsByRecipe[ingredient.recipeId] = [];
      }
      ingredientsByRecipe[ingredient.recipeId].push({
        name: ingredient.name || '',
        quantity: ingredient.quantity || '',
        measurementUnit: ingredient.measurementUnit || '',
        notes: ingredient.notes || ''
      });
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    console.log('\n🚀 Starting import process...\n');

    // Import recipes from spices.json
    for (const recipe of spicesData) {
      try {
        // Skip invalid recipes
        if (!recipe.name || recipe.name.trim().length === 0) {
          console.log(`⏭️  Skipping recipe with no name`);
          skipped++;
          continue;
        }

        // Skip recipes that are actually notes or instructions
        const nameLower = recipe.name.toLowerCase();
        if (
          nameLower.includes('note:') ||
          nameLower.includes('grate the') ||
          nameLower.includes('follow the') ||
          nameLower.includes('welcome to') ||
          recipe.name.length > 200
        ) {
          console.log(`⏭️  Skipping invalid entry: ${recipe.name.substring(0, 50)}...`);
          skipped++;
          continue;
        }

        // Check if recipe already exists by id or slug
        const existingRecipe = await Recipe.findOne({
          $or: [
            { slug: recipe.slug },
            { name: recipe.name }
          ]
        });

        if (existingRecipe) {
          console.log(`⏭️  Already exists: ${recipe.name}`);
          skipped++;
          continue;
        }

        // Get ingredients for this recipe
        const recipeIngredients = ingredientsByRecipe[recipe.id] || [];

        // Filter out invalid ingredients (instructions mixed as ingredients)
        const validIngredients = recipeIngredients.filter(ing => {
          const name = ing.name.toLowerCase();
          return (
            ing.name.length > 0 &&
            ing.name.length < 150 &&
            !name.includes('the same pan') &&
            !name.includes('in the sour cream') &&
            !name.includes('the mixture to simmer') &&
            !name.includes('directions:') &&
            !name.includes('method:')
          );
        });

        // Extract actual instructions from ingredients if present
        const instructionIngredients = recipeIngredients.filter(ing => {
          const name = ing.name.toLowerCase();
          return (
            name.includes('the same pan') ||
            name.includes('in the sour cream') ||
            name.includes('the mixture to simmer') ||
            name.includes('directions:') ||
            name.includes('method:') ||
            (ing.name.length > 150)
          );
        });

        // Build instructions array
        const instructions = instructionIngredients.length > 0
          ? instructionIngredients.map((ing, index) => ({
              stepNumber: index + 1,
              instruction: ing.name
            }))
          : recipe.description && recipe.description.trim().length > 10
          ? [
              {
                stepNumber: 1,
                instruction: recipe.description
              }
            ]
          : validIngredients.length > 0
          ? [
              {
                stepNumber: 1,
                instruction: `Prepare the ${recipe.name.toLowerCase()} by following traditional cooking methods. Ensure all ingredients are fresh and properly washed.`
              },
              {
                stepNumber: 2,
                instruction: 'Combine the ingredients according to your preferred cooking technique.'
              },
              {
                stepNumber: 3,
                instruction: `Cook until done, season to taste, and serve hot. Serves ${recipe.servingSize || 4} people.`
              }
            ]
          : [
              {
                stepNumber: 1,
                instruction: `This is a ${recipe.difficultyLevel?.toLowerCase() || 'simple'} ${recipe.category?.toLowerCase() || 'dish'} recipe. Detailed instructions are being compiled.`
              }
            ];

        // Create recipe document
        const recipeDoc = new Recipe({
          name: recipe.name,
          slug: recipe.slug,
          category: recipe.category || 'Main Dish',
          cuisine: recipe.cuisine || 'International',
          description: recipe.description || '',
          isVegetarian: recipe.isVegetarian !== undefined ? recipe.isVegetarian : true,
          isVegan: recipe.isVegan !== undefined ? recipe.isVegan : false,
          cookingTimeMinutes: recipe.cookingTimeMinutes || null,
          servingSize: recipe.servingSize || 4,
          difficultyLevel: recipe.difficultyLevel || 'Easy',
          dataSource: 'imported',
          ingredients: validIngredients,
          instructions: instructions,
          tags: [
            recipe.category?.toLowerCase(),
            recipe.cuisine?.toLowerCase(),
            recipe.isVegetarian ? 'vegetarian' : null,
            recipe.isVegan ? 'vegan' : null
          ].filter(Boolean),
          createdAt: recipe.createdAt ? new Date(recipe.createdAt) : new Date()
        });

        await recipeDoc.save();
        imported++;
        console.log(`✅ [${imported}] Imported: ${recipe.name}`);

      } catch (error) {
        console.error(`❌ Error importing "${recipe.name}":`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Import Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${imported} recipes`);
    console.log(`⏭️  Skipped: ${skipped} recipes`);
    console.log(`❌ Errors: ${errors} recipes`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  }
};

// Run the seeder
seedCleanedData();
