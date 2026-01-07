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
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Helper function to parse ingredients
function parseIngredients(ingredients) {
  if (!Array.isArray(ingredients)) return [];
  
  return ingredients
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(item => {
      const lower = item.toLowerCase();
      return item.length > 0 && 
             !item.startsWith('*') && 
             !item.startsWith('_') &&
             !lower.includes('media omitted') &&
             !lower.includes('this message was deleted') &&
             !lower.includes('follow the') &&
             !lower.includes('whatsapp.com') &&
             !lower.includes('thank you') &&
             !lower.includes('welcome to healthy') &&
             !lower.includes('hbn vegetarian') &&
             !lower.includes('enjoy') &&
             item !== '-' &&
             item.length < 200;
    });
}

// Helper function to parse instructions
function parseInstructions(ingredients) {
  if (!Array.isArray(ingredients)) return [];
  
  return ingredients
    .filter(item => typeof item === 'string')
    .filter(item => {
      const lower = item.toLowerCase();
      return (item.match(/^\d+\./) || 
              lower.includes('directions:') ||
              lower.includes('method') ||
              lower.includes('instructions') ||
              lower.includes('step ')) &&
             !lower.includes('media omitted') &&
             !lower.includes('this message was deleted');
    })
    .map(item => item.trim())
    .filter(item => item.length > 10);
}

// Helper to extract cooking time
function extractCookingTime(ingredients, instructions) {
  const allText = [...ingredients, ...instructions].join(' ').toLowerCase();
  const timeMatch = allText.match(/(\d+)\s*(min|minute|minutes|hour|hours)/i);
  
  if (timeMatch) {
    const value = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    
    if (unit.startsWith('hour')) {
      return value * 60;
    }
    return value;
  }
  
  return null;
}

// Helper to extract difficulty
function extractDifficulty(name, ingredients) {
  const text = (name + ' ' + ingredients.join(' ')).toLowerCase();
  
  if (text.includes('easy') || text.includes('quick') || text.includes('simple')) {
    return 'Easy';
  }
  if (text.includes('advanced') || text.includes('complex')) {
    return 'Hard';
  }
  return 'Medium';
}

// Helper to generate slug
function generateSlug(name, id) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug}-${id}`;
}

// Helper to extract actual recipe name from ingredients
function extractRecipeName(recipe) {
  // Look for patterns like "*Recipe Name*" or "_Recipe Name_"
  for (const item of recipe.ingredients) {
    if (typeof item === 'string') {
      const titleMatch = item.match(/[\*_]([A-Z][^*_]{5,60})[\*_]/);
      if (titleMatch && !titleMatch[1].toLowerCase().includes('ingredient') && 
          !titleMatch[1].toLowerCase().includes('method') &&
          !titleMatch[1].toLowerCase().includes('direction')) {
        return titleMatch[1].trim();
      }
    }
  }
  return null;
}

async function seedNewRecipes() {
  try {
    console.log('📖 Reading new recipes file...');
    const newRecipesPath = path.join(__dirname, '../../recipes.json');
    const newRecipesData = JSON.parse(fs.readFileSync(newRecipesPath, 'utf8'));
    
    console.log(`📊 Found ${newRecipesData.recipes.length} recipes in new file`);
    
    // Get all existing recipe names from database
    console.log('🔍 Fetching existing recipes from database...');
    const existingRecipes = await Recipe.find({}, 'name slug').lean();
    const existingNames = new Set(existingRecipes.map(r => r.name.toLowerCase().trim()));
    const existingSlugs = new Set(existingRecipes.map(r => r.slug));
    
    console.log(`📋 Found ${existingRecipes.length} existing recipes in database`);
    
    let added = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const recipe of newRecipesData.recipes) {
      try {
        // Extract actual recipe name
        const extractedName = extractRecipeName(recipe);
        const recipeName = extractedName || recipe.name;
        
        // Skip if it's just the welcome message
        if (recipeName.toLowerCase().includes('welcome to healthy by nature') || 
            recipeName.toLowerCase().includes('hbn vegetarian kitchen')) {
          skipped++;
          continue;
        }
        
        // Check if recipe already exists
        const nameLower = recipeName.toLowerCase().trim();
        if (existingNames.has(nameLower)) {
          skipped++;
          continue;
        }
        
        const ingredients = parseIngredients(recipe.ingredients);
        const instructions = parseInstructions(recipe.ingredients);
        
        // Skip if no meaningful content
        if (ingredients.length === 0 && instructions.length === 0) {
          skipped++;
          continue;
        }
        
        // Generate slug
        let slug = generateSlug(recipeName, recipe.id);
        let slugCounter = 1;
        while (existingSlugs.has(slug)) {
          slug = `${generateSlug(recipeName, recipe.id)}-${slugCounter}`;
          slugCounter++;
        }
        
        const cookingTime = extractCookingTime(ingredients, instructions);
        const difficulty = extractDifficulty(recipeName, ingredients);
        
        // Create recipe document
        const newRecipe = new Recipe({
          name: recipeName,
          slug: slug,
          description: ingredients.slice(0, 2).join('. ').substring(0, 200),
          category: recipe.category || 'Main Dish',
          cuisine: recipe.cuisine || 'International',
          dietaryRestrictions: ['vegetarian'],
          ingredients: ingredients.slice(0, 20).map((ing, idx) => ({
            name: ing,
            quantity: '',
            unit: '',
            order: idx + 1
          })),
          instructions: instructions.length > 0 
            ? instructions.slice(0, 15).map((inst, idx) => ({
                stepNumber: idx + 1,
                instruction: inst,
                duration: null
              }))
            : (ingredients.length > 0 ? [{
                stepNumber: 1,
                instruction: ingredients.join('. '),
                duration: null
              }] : []),
          cookingTimeMinutes: cookingTime,
          servingSize: 4,
          difficulty: difficulty,
          isPublic: true,
          source: 'HBN Vegetarian Kitchen',
          tags: [recipe.category, recipe.cuisine, 'vegetarian'].filter(Boolean),
        });
        
        await newRecipe.save();
        existingNames.add(nameLower);
        existingSlugs.add(slug);
        added++;
        
        if (added % 50 === 0) {
          console.log(`✅ Added ${added} recipes so far...`);
        }
        
      } catch (error) {
        errors++;
        if (errors <= 5) {
          console.error(`Error processing recipe ${recipe.id}:`, error.message);
        }
      }
    }
    
    console.log('\n📊 Seeding Summary:');
    console.log(`✅ Added: ${added} new recipes`);
    console.log(`⏭️  Skipped: ${skipped} (duplicates or invalid)`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`\n🎉 Total recipes in database: ${existingRecipes.length + added}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

seedNewRecipes();
