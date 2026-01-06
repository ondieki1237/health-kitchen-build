# 🔌 Health Kitchen – API & Database Integration Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema Design](#database-schema-design)
4. [TheMealDB API Integration](#themealdb-api-integration)
5. [Data Processing Pipeline](#data-processing-pipeline)
6. [API Usage Strategies](#api-usage-strategies)
7. [Vegetarian Recipe Data Migration](#vegetarian-recipe-data-migration)
8. [Search & Filter Implementation](#search--filter-implementation)
9. [Caching & Performance](#caching--performance)
10. [Error Handling & Fallbacks](#error-handling--fallbacks)
11. [Code Examples](#code-examples)
12. [Security & Best Practices](#security--best-practices)

---

## 🎯 Overview

This document provides a complete technical guide for building **Health Kitchen**, an open-source plant-based nutrition platform that:
- Uses **TheMealDB API** for recipe discovery
- Stores and manages recipes in a local database
- Integrates existing vegetarian recipe data from JSON files
- Provides rich search, filtering, and nutrition features

### Technology Stack Recommendations
- **Backend**: Node.js (Express.js recommended)
- **Database**: MongoDB (with Mongoose ODM)
- **Storage**: AWS S3, Cloudinary, or MongoDB GridFS (for user photos)
- **Cache**: Redis (optional but recommended)
- **API Key**: Use test key `1` for development, upgrade for production
- **Real-time**: Socket.io (for live comments/notifications)

---

## 🏗️ System Architecture

```
┌─────────────────┐
│  User Interface │
│   (Web/Mobile)  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│     Application Server (Backend)          │
│  ┌──────────────────────────────────┐    │
│  │   API Controller Layer            │    │
│  │  (Recipe, Menu, Comment, Rating)  │    │
│  └──────────┬────────────────────────┘    │
│             │                              │
│  ┌──────────▼───────────┬─────────────┐  │
│  │  TheMealDB Service   │ Recipe      │  │
│  │  (API Integration)   │ Service     │  │
│  └──────────┬───────────┴─────┬───────┘  │
│             │                  │          │
│  ┌──────────▼──────┐  ┌────────▼────────┐│
│  │  Community       │  │  Media Upload   ││
│  │  Features        │  │  Service        ││
│  │  (Comments/Rate) │  │  (Cloudinary)   ││
│  └──────────────────┘  └─────────────────┘│
└────────────┼──────────────────┼───────────┘
             │                  │
    ┌────────▼────────┐  ┌──────▼──────┐
    │   TheMealDB     │  │   MongoDB   │
    │  API (External) │  │  Database   │
    └─────────────────┘  └─────────────┘
```

---

## 🗄️ MongoDB Database Schema Design

### 1. **recipes** Collection (Core Recipe Data)

```javascript
// MongoDB Schema using Mongoose
const recipeSchema = new mongoose.Schema({
    mealDbId: { type: String, unique: true, sparse: true },  // TheMealDB ID (if from API)
    name: { type: String, required: true, index: true },
    slug: { type: String, unique: true, required: true },
    category: { type: String, index: true },  // Main Dish, Snack, Dessert, etc.
    cuisine: { type: String, index: true },   // International, African, Indian, etc.
    area: String,  // Country/Region from TheMealDB
    isVegan: { type: Boolean, default: false, index: true },
    isVegetarian: { type: Boolean, default: true, index: true },
    thumbnailUrl: String,
    videoUrl: String,
    sourceUrl: String,
    description: String,
    cookingTimeMinutes: Number,
    servingSize: { type: Number, default: 4 },
    difficultyLevel: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    caloriesPerServing: Number,
    dataSource: { type: String, default: 'manual', enum: ['themealdb', 'manual', 'imported', 'user'] },
    
    // User who created (for user-generated recipes)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Ingredients with measurements
    ingredients: [{
        name: { type: String, required: true },
        quantity: String,
        measurementUnit: String,
        notes: String
    }],
    
    // Cooking instructions
    instructions: [{
        stepNumber: Number,
        instruction: { type: String, required: true },
        timeMinutes: Number
    }],
    
    // Tags for filtering
    tags: [{ type: String, index: true }],  // ['gluten-free', 'high-protein', 'quick-meal']
    
    // Social features
    stats: {
        views: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 },
        tried: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        totalRatings: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 }
    },
    
    // Nutrition (optional detailed breakdown)
    nutrition: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        sugar: Number,
        sodium: Number
    }
}, {
    timestamps: true  // Adds createdAt and updatedAt automatically
});

// Text search index
recipeSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Recipe = mongoose.model('Recipe', recipeSchema);
```

### 2. **users** Collection (User Accounts)

```javascript
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    displayName: String,
    avatar: String,  // URL to profile picture
    bio: String,
    location: String,
    
    // Dietary preferences
    dietaryPreferences: {
        isVegan: { type: Boolean, default: false },
        isVegetarian: { type: Boolean, default: true },
        allergies: [String],  // ['nuts', 'gluten', 'soy']
        dislikedIngredients: [String]
    },
    
    // Social stats
    stats: {
        recipesCreated: { type: Number, default: 0 },
        menusCreated: { type: Number, default: 0 },
        followers: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        totalLikes: { type: Number, default: 0 }
    },
    
    // Saved recipes and menus
    savedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    savedMenus: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Menu' }],
    
    // Achievements
    badges: [{
        name: String,
        icon: String,
        earnedAt: Date
    }],
    
    isVerified: { type: Boolean, default: false },
    lastLoginAt: Date
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
```

### 3. **menus** Collection (User-Created Meal Plans)

```javascript
const menuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    description: String,
    coverImage: String,  // Main image for the menu
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Menu type
    type: { 
        type: String, 
        enum: ['daily', 'weekly', 'special-occasion', 'meal-prep', 'budget', 'quick'], 
        default: 'daily' 
    },
    
    // Recipes organized by meal times
    meals: [{
        mealTime: { 
            type: String, 
            enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'],
            required: true
        },
        recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
        servings: Number,
        notes: String,
        day: { type: Number, min: 1, max: 7 }  // For weekly menus
    }],
    
    // Menu metadata
    totalCookingTime: Number,  // Total minutes
    estimatedCost: Number,  // Optional cost estimate
    servesCount: Number,
    tags: [String],  // ['budget-friendly', 'family', 'romantic-dinner']
    
    // Social features
    stats: {
        views: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 },
        tried: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        totalRatings: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 }
    },
    
    isPublic: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
}, {
    timestamps: true
});

menuSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Menu = mongoose.model('Menu', menuSchema);
```

### 4. **comments** Collection (User Comments & Reviews)

```javascript
const commentSchema = new mongoose.Schema({
    // Can be on recipe or menu
    targetType: { type: String, enum: ['Recipe', 'Menu'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
    
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    
    // User's cooking result
    userPhoto: String,  // Photo of their attempt
    rating: { type: Number, min: 1, max: 5 },  // 1-5 stars
    
    // Modifications made
    modifications: String,  // What they changed
    cookingTips: String,  // Tips they want to share
    
    // Engagement
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Nested replies
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    hasReplies: { type: Boolean, default: false },
    repliesCount: { type: Number, default: 0 },
    
    // Moderation
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    isHidden: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false }
}, {
    timestamps: true
});

commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
commentSchema.index({ parentComment: 1 });

const Comment = mongoose.model('Comment', commentSchema);
```

### 5. **cookingAttempts** Collection (User Cooking Results)

```javascript
const cookingAttemptSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Can track attempts for recipes or full menus
    targetType: { type: String, enum: ['Recipe', 'Menu'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
    
    // User's experience
    photos: [String],  // Multiple photos of the result
    rating: { type: Number, min: 1, max: 5, required: true },
    review: String,
    
    // Cooking details
    actualCookingTime: Number,  // Minutes
    difficultyExperienced: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    modifications: String,  // What they changed
    tips: String,  // Tips for others
    
    // Success indicators
    wouldMakeAgain: { type: Boolean, default: true },
    servedTo: Number,  // How many people
    occasion: String,  // 'family-dinner', 'date-night', 'meal-prep'
    
    // Cost tracking (optional)
    estimatedCost: Number,
    
    // Engagement
    likes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    
    // Visibility
    isPublic: { type: Boolean, default: true }
}, {
    timestamps: true
});

cookingAttemptSchema.index({ user: 1, createdAt: -1 });
cookingAttemptSchema.index({ targetType: 1, targetId: 1, rating: -1 });

const CookingAttempt = mongoose.model('CookingAttempt', cookingAttemptSchema);
```

### 6. **notifications** Collection (User Notifications)

```javascript
const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    type: { 
        type: String, 
        enum: [
            'comment', 'reply', 'like', 'follow', 'mention',
            'recipe-featured', 'menu-featured', 'badge-earned',
            'cooking-milestone'
        ],
        required: true 
    },
    
    // Reference to related content
    targetType: { type: String, enum: ['Recipe', 'Menu', 'Comment', 'User'] },
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: 'targetType' },
    
    message: { type: String, required: true },
    image: String,  // Optional thumbnail
    
    isRead: { type: Boolean, default: false },
    readAt: Date
}, {
    timestamps: true
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
```

### 7. **Additional Creative Collections**

```javascript
// Weekly Meal Plans (Community Shared)
const mealPlanSchema = new mongoose.Schema({
    name: String,
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    weekMenus: [{
        day: Number,
        breakfast: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
        lunch: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
        dinner: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
        snacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }]
    }],
    shoppingList: [{ ingredient: String, quantity: String }],
    totalBudget: Number,
    stats: { saves: Number, tried: Number },
    tags: [String]
}, { timestamps: true });

// Cooking Challenges (Gamification)
const challengeSchema = new mongoose.Schema({
    title: String,
    description: String,
    icon: String,
    type: { type: String, enum: ['ingredient', 'cuisine', 'time', 'cost', 'technique'] },
    criteria: mongoose.Schema.Types.Mixed,  // Challenge rules
    startDate: Date,
    endDate: Date,
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    prize: String
}, { timestamps: true });

// Shopping Lists (With Price Tracking)
const shoppingListSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    items: [{
        ingredient: String,
        quantity: String,
        category: String,  // Produce, Grains, Spices
        checked: Boolean,
        estimatedPrice: Number,
        store: String
    }],
    totalEstimatedCost: Number,
    isActive: Boolean
}, { timestamps: true });

// Ingredient Substitutions (Community Knowledge)
const substitutionSchema = new mongoose.Schema({
    originalIngredient: String,
    substituteIngredient: String,
    ratio: String,  // "1:1" or "2:1"
    notes: String,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usefulVotes: Number,
    verifiedByAdmin: Boolean
}, { timestamps: true });

// Cooking Tips & Techniques Library
const cookingTipSchema = new mongoose.Schema({
    title: String,
    category: String,  // 'knife-skills', 'seasoning', 'timing'
    content: String,
    video: String,
    images: [String],
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: Number,
    isVerified: Boolean
}, { timestamps: true });
```

---

## 🌐 TheMealDB API Integration

### API Endpoints Strategy

#### 1. **Initial Database Population**

Use these endpoints to seed your database:

```
1. Get all categories:
   GET /api/json/v1/1/categories.php
   
2. Get all areas (cuisines):
   GET /api/json/v1/1/list.php?a=list
   
3. Get all ingredients:
   GET /api/json/v1/1/list.php?i=list
   
4. Filter vegetarian meals by area:
   GET /api/json/v1/1/filter.php?a=Indian
   GET /api/json/v1/1/filter.php?a=Italian
   
5. Get full meal details:
   GET /api/json/v1/1/lookup.php?i={mealId}
```

#### 2. **Ongoing Sync Strategy**

- Run daily/weekly sync jobs
- Check for new meals using random selection
- Update existing meals that haven't been synced in 30 days

---

## 🔄 Data Processing Pipeline

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Fetch Data from TheMealDB API                   │
│ - Use filter endpoints to get vegetarian-friendly meals │
│ - Fetch full meal details by ID                         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ STEP 2: Validate & Filter for Plant-Based               │
│ - Check ingredients for meat/fish/eggs/dairy            │
│ - Mark as vegan or vegetarian                           │
│ - Skip meals with non-vegetarian ingredients            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ STEP 3: Parse & Normalize Data                          │
│ - Extract ingredients with measurements                 │
│ - Parse instruction steps                               │
│ - Download and store thumbnail images locally           │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ STEP 4: Enrich with Nutrition Data                      │
│ - Look up ingredient nutrition from Open Food Facts     │
│ - Calculate total calories per serving                  │
│ - Add protein/carbs/fat breakdown                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ STEP 5: Store in Database                               │
│ - Insert recipe into recipes table                      │
│ - Insert/link ingredients                               │
│ - Insert instruction steps                              │
│ - Generate recipe tags                                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│ STEP 6: Cache & Index                                   │
│ - Update search index (Elasticsearch/PostgreSQL FTS)    │
│ - Cache popular recipes in Redis                        │
│ - Generate sitemap for SEO                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 API Usage Strategies

### A. Intelligent Filtering for Vegetarian Meals

Since TheMealDB doesn't have a direct vegetarian filter, use these strategies:

**1. Filter by Vegetarian-Friendly Cuisines:**
```javascript
const vegetarianFriendlyAreas = [
    'Indian',      // Many vegetarian dishes
    'Italian',     // Pasta, risotto (filter out meat)
    'Mexican',     // Bean-based dishes
    'Thai',        // Tofu and vegetable curries
    'Japanese',    // Sushi (vegetable), miso soup
    'Chinese'      // Stir-fries (filter out meat)
];
```

**2. Filter by Vegetarian-Friendly Categories:**
```javascript
const vegetarianCategories = [
    'Vegetarian',
    'Side',
    'Pasta',
    'Dessert',
    'Breakfast',
    'Starter'
];
```

**3. Filter by Plant-Based Ingredients:**
```javascript
const vegetarianIngredients = [
    'chickpeas', 'lentils', 'tofu', 'beans', 'rice',
    'pasta', 'mushrooms', 'spinach', 'tomatoes'
];
```

### B. API Call Optimization

```javascript
// Batch API calls to avoid rate limiting
async function fetchMealsByCategory(category) {
    const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
    );
    const data = await response.json();
    
    // Get full details for first 10 meals
    const detailPromises = data.meals.slice(0, 10).map(meal => 
        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
            .then(r => r.json())
    );
    
    return await Promise.all(detailPromises);
}
```

### C. API Response Caching

```javascript
// Cache API responses for 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function fetchWithCache(endpoint, cacheKey) {
    // Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    
    // Fetch from API
    const response = await fetch(endpoint);
    const data = await response.json();
    
    // Store in cache
    await redis.setex(cacheKey, CACHE_DURATION / 1000, JSON.stringify(data));
    
    return data;
}
```

---

## 🥗 Vegetarian Recipe Data Migration

### Migrating vegetarian_recipes.json to Database

Your existing `vegetarian_recipes.json` contains valuable data. Here's how to migrate it:

**Migration Script Structure:**

```javascript
const fs = require('fs');
const { Pool } = require('pg');

async function migrateRecipes() {
    // Read JSON file
    const jsonData = fs.readFileSync('vegetarian_recipes.json', 'utf8');
    const { recipes } = JSON.parse(jsonData);
    
    const pool = new Pool({ /* db config */ });
    
    for (const recipe of recipes) {
        try {
            // 1. Insert main recipe
            const recipeResult = await pool.query(`
                INSERT INTO recipes (name, category, cuisine, description, is_vegetarian, data_source)
                VALUES ($1, $2, $3, $4, $5, 'imported')
                RETURNING id
            `, [
                recipe.name,
                recipe.category,
                recipe.cuisine,
                recipe.notes,
                true
            ]);
            
            const recipeId = recipeResult.rows[0].id;
            
            // 2. Parse and insert ingredients
            if (recipe.ingredients) {
                await parseAndInsertIngredients(recipeId, recipe.ingredients);
            }
            
            // 3. Parse and insert instructions
            if (recipe.instructions) {
                await parseAndInsertInstructions(recipeId, recipe.instructions);
            }
            
            console.log(`✅ Migrated: ${recipe.name}`);
            
        } catch (error) {
            console.error(`❌ Failed to migrate ${recipe.name}:`, error);
        }
    }
    
    await pool.end();
}

function parseAndInsertIngredients(recipeId, ingredientsText) {
    // Parse ingredients from text format
    // Example: "1 cup rice" -> {ingredient: "rice", quantity: "1 cup"}
    const lines = ingredientsText.split('\n');
    
    lines.forEach(async (line, index) => {
        if (line.trim()) {
            const parsed = parseIngredientLine(line);
            
            // Insert or get ingredient
            const ingredientResult = await pool.query(`
                INSERT INTO ingredients (name, slug)
                VALUES ($1, $2)
                ON CONFLICT (name) DO NOTHING
                RETURNING id
            `, [parsed.ingredient, slugify(parsed.ingredient)]);
            
            // Link to recipe
            await pool.query(`
                INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, display_order)
                VALUES ($1, $2, $3, $4)
            `, [recipeId, ingredientResult.rows[0].id, parsed.quantity, index + 1]);
        }
    });
}
```

### Ingredient Parsing Logic

```javascript
function parseIngredientLine(line) {
    // Regex to extract quantity and ingredient
    // Examples:
    // "1 cup rice" -> {quantity: "1 cup", ingredient: "rice"}
    // "2 tablespoons olive oil" -> {quantity: "2 tablespoons", ingredient: "olive oil"}
    
    const pattern = /^([\d\/\s]+(?:cup|tablespoon|teaspoon|gram|oz|lb|piece)?s?)\s+(.+)$/i;
    const match = line.match(pattern);
    
    if (match) {
        return {
            quantity: match[1].trim(),
            ingredient: match[2].trim()
        };
    }
    
    // If no quantity found, treat entire line as ingredient
    return {
        quantity: 'to taste',
        ingredient: line.trim()
    };
}
```

---

## 🔍 Search & Filter Implementation

### Full-Text Search (PostgreSQL)

```sql
-- Add search vector column
ALTER TABLE recipes ADD COLUMN search_vector tsvector;

-- Create trigger to auto-update search vector
CREATE OR REPLACE FUNCTION recipes_search_trigger() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.category, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_search_update 
BEFORE INSERT OR UPDATE ON recipes
FOR EACH ROW EXECUTE FUNCTION recipes_search_trigger();

-- Create GIN index for fast searching
CREATE INDEX recipes_search_idx ON recipes USING gin(search_vector);
```

### Search Query Examples

```javascript
// 1. Simple text search
async function searchRecipes(query) {
    return await pool.query(`
        SELECT r.*, 
               ts_rank(r.search_vector, plainto_tsquery('english', $1)) as rank
        FROM recipes r
        WHERE r.search_vector @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT 20
    `, [query]);
}

// 2. Filter by ingredients
async function findRecipesByIngredients(ingredientNames) {
    return await pool.query(`
        SELECT DISTINCT r.*
        FROM recipes r
        JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE i.name = ANY($1)
        AND r.is_vegetarian = true
    `, [ingredientNames]);
}

// 3. Advanced filtering
async function filterRecipes(filters) {
    let query = 'SELECT * FROM recipes WHERE 1=1';
    const params = [];
    
    if (filters.category) {
        params.push(filters.category);
        query += ` AND category = $${params.length}`;
    }
    
    if (filters.cuisine) {
        params.push(filters.cuisine);
        query += ` AND cuisine = $${params.length}`;
    }
    
    if (filters.isVegan) {
        query += ' AND is_vegan = true';
    }
    
    if (filters.maxCookingTime) {
        params.push(filters.maxCookingTime);
        query += ` AND cooking_time_minutes <= $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC LIMIT 50';
    
    return await pool.query(query, params);
}
```

---

## ⚡ Caching & Performance

### Redis Caching Strategy

```javascript
// Cache popular recipes
async function getRecipe(id) {
    const cacheKey = `recipe:${id}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    
    // Fetch from database
    const recipe = await fetchRecipeFromDB(id);
    
    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(recipe));
    
    return recipe;
}

// Cache search results
async function getCachedSearch(query, filters) {
    const cacheKey = `search:${query}:${JSON.stringify(filters)}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    
    const results = await searchRecipes(query, filters);
    
    // Cache for 15 minutes
    await redis.setex(cacheKey, 900, JSON.stringify(results));
    
    return results;
}
```

### Database Query Optimization

```sql
-- Materialized view for popular recipes
CREATE MATERIALIZED VIEW popular_recipes AS
SELECT r.*, COUNT(f.id) as favorites_count
FROM recipes r
LEFT JOIN favorites f ON r.id = f.recipe_id
GROUP BY r.id
ORDER BY favorites_count DESC
LIMIT 100;

-- Refresh daily
REFRESH MATERIALIZED VIEW popular_recipes;
```

---

## ❌ Error Handling & Fallbacks

### API Error Handling

```javascript
async function safeFetchFromAPI(endpoint, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error(`API call failed (attempt ${i + 1}/${retries}):`, error);
            
            if (i === retries - 1) {
                // Log to monitoring system
                await logAPIError(endpoint, error);
                
                // Return cached data or empty result
                return await getFallbackData(endpoint);
            }
            
            // Wait before retry (exponential backoff)
            await sleep(Math.pow(2, i) * 1000);
        }
    }
}

async function getFallbackData(endpoint) {
    // Return cached data if available
    const cached = await redis.get(`fallback:${endpoint}`);
    if (cached) {
        return JSON.parse(cached);
    }
    
    // Return empty result
    return { meals: [] };
}
```

---

## 💻 Code Examples

### Complete Recipe Fetcher

```javascript
const axios = require('axios');
const mongoose = require('mongoose');

class RecipeService {
    constructor() {
        this.apiBaseUrl = 'https://www.themealdb.com/api/json/v1/1';
        this.apiKey = '1'; // Use test key
        
        // Connect to MongoDB
        mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/health_kitchen', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }
    
    // Fetch and store vegetarian meals from a specific area
    async syncMealsByArea(area) {
        try {
            // 1. Get meals from area
            const mealsResponse = await axios.get(
                `${this.apiBaseUrl}/filter.php?a=${area}`
            );
            
            const meals = mealsResponse.data.meals || [];
            console.log(`Found ${meals.length} meals from ${area}`);
            
            // 2. Fetch full details for each meal
            for (const meal of meals) {
                const detailsResponse = await axios.get(
                    `${this.apiBaseUrl}/lookup.php?i=${meal.idMeal}`
                );
                
                const fullMeal = detailsResponse.data.meals[0];
                
                // 3. Check if vegetarian
                if (await this.isVegetarianMeal(fullMeal)) {
                    await this.storeMeal(fullMeal);
                    console.log(`✅ Stored: ${fullMeal.strMeal}`);
                } else {
                    console.log(`⏭️  Skipped (contains meat): ${fullMeal.strMeal}`);
                }
                
                // Rate limiting: wait 100ms between requests
                await this.sleep(100);
            }
            
            // 4. Log sync
            await this.logSync(area, meals.length);
            
        } catch (error) {
            console.error(`Error syncing meals from ${area}:`, error);
        }
    }
    
    // Check if meal is vegetarian
    async isVegetarianMeal(meal) {
        const nonVegetarianKeywords = [
            'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon',
            'tuna', 'shrimp', 'prawn', 'bacon', 'ham', 'meat',
            'turkey', 'duck', 'sausage', 'seafood'
        ];
        
        // Check meal name
        const mealName = meal.strMeal.toLowerCase();
        for (const keyword of nonVegetarianKeywords) {
            if (mealName.includes(keyword)) {
                return false;
            }
        }
        
        // Check all ingredients
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            if (ingredient) {
                const ingredientLower = ingredient.toLowerCase();
                for (const keyword of nonVegetarianKeywords) {
                    if (ingredientLower.includes(keyword)) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    // Store meal in database
    async storeMeal(meal) {
        try {
            // Parse ingredients
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
                const ingredient = meal[`strIngredient${i}`];
                const measure = meal[`strMeasure${i}`];
                
                if (ingredient && ingredient.trim()) {
                    ingredients.push({
                        name: ingredient.trim(),
                        quantity: measure?.trim() || 'to taste'
                    });
                }
            }
            
            // Parse instructions
            const instructionSteps = meal.strInstructions
                .split('\n')
                .filter(s => s.trim())
                .map((instruction, index) => ({
                    stepNumber: index + 1,
                    instruction: instruction.trim()
                }));
            
            // Create or update recipe
            const recipe = await Recipe.findOneAndUpdate(
                { mealDbId: meal.idMeal },
                {
                    mealDbId: meal.idMeal,
                    name: meal.strMeal,
                    slug: this.slugify(meal.strMeal),
                    category: meal.strCategory,
                    cuisine: meal.strCategory,
                    area: meal.strArea,
                    thumbnailUrl: meal.strMealThumb,
                    videoUrl: meal.strYoutube,
                    sourceUrl: meal.strSource,
                    description: meal.strInstructions,
                    isVegetarian: true,
                    dataSource: 'themealdb',
                    ingredients,
                    instructions: instructionSteps,
                    tags: [meal.strCategory, meal.strArea].filter(Boolean)
                },
                { 
                    upsert: true, 
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
            
            return recipe;
            
        } catch (error) {
            console.error('Error storing meal:', error);
            throw error;
        }
    }
    
    // Helper: slugify text
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    // Helper: sleep
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Log sync activity
    async logSync(area, recordsFetched) {
        await this.pool.query(`
            INSERT INTO api_sync_log (endpoint, parameters, records_fetched)
            VALUES ($1, $2, $3)
        `, [`filter.php?a=${area}`, JSON.stringify({ area }), recordsFetched]);
    }
}

// Usage
(async () => {
    const service = new RecipeService();
    
    const areas = ['Indian', 'Italian', 'Mexican', 'Thai'];
    
    for (const area of areas) {
        console.log(`\n🌍 Syncing meals from ${area}...`);
        await service.syncMealsByArea(area);
    }
    
    console.log('\n✅ Sync complete!');
    process.exit(0); (optional - can store in a logs collection)
    async logSync(area, recordsFetched) {
        // Optional: Store sync logs in MongoDB
        console.log(`Synced ${recordsFetched} recipes from ${area}`
## 🔐 Security & Best Practices

### 1. API Key Management

```javascript
// NEVER hardcode API keys in production
// Use environment variables
require('dotenv').config();

const API_KEY = process.env.THEMEALDB_API_KEY || '1'; // Fallback to test key
```

### 2. Input Validation

```javascript
function validateRecipeInput(data) {
    const schema = {
        name: { type: 'string', required: true, maxLength: 255 },
        category: { type: 'string', maxLength: 100 },
        ingredients: { type: 'array', required: true, minItems: 1 }
    };
    
    // Implement validation logic
    // Use libraries like Joi or Yup
}
```

### 3. SQL Injection Prevention

```javascript
// ✅ ALWAYS use parameterized queries
const query = 'SELECT * FROM recipes WHERE name = $1';
await pool.query(query, [userInput]);

// ❌ NEVER concatenate user input
// const badQuery = `SELECT * FROM recipes WHERE name = '${userInput}'`;
```

### 4. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

app.use('/api/', apiLimiter);
```

### 5. Data Sanitization

```javascript
const sanitizeHtml = require('sanitize-html');

function sanitizeRecipeData(recipe) {
    return {
        ...recipe,
        name: sanitizeHtml(recipe.name, { allowedTags: [] }),
        description: sanitizeHtml(recipe.description, {
            allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br']
        })
    };
}
```

---

## 🚀 Deployment Checklist

### Before Going Live:

- [ ] Upgrade to production API key from TheMealDB (if releasing publicly)
- [ ] Set up database backups (daily automated backups)
- [ ] Configure Redis for caching
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Implement rate limiting
- [ ] Add SSL certificate (Let's Encrypt)
- [ ] Set up CDN for images (Cloudinary, imgix)
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Set up error logging and alerts
- [ ] Configure environment variables properly
- [ ] Run security audit (npm audit, Snyk)
- [ ] Set up CI/CD pipeline
- [ ] Create database indexes
- [ ] Test with production-like data volume
- [ ] Set up monitoring dashboards (Grafana, DataDog)

---

## 📚 Additional Resources

- **TheMealDB Documentation**: https://www.themealdb.com/api.php
- **PostgreSQL Full-Text Search**: https://www.postgresql.org/docs/current/textsearch.html
- **Redis Caching Guide**: https://redis.io/topics/lru-cache
- **Open Food Facts API**: https://world.openfoodfacts.org/data

---

## 🤝 Contributing

This is an open-source project. Contributions are welcome!

### How to Contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 License

This project is open source and available under the MIT License.

---

**Built with 💚 for healthy eating and plant-based living**

*Last Updated: January 5, 2026*
