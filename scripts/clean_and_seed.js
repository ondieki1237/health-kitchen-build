import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Import local modules (adjust paths as needed)
// We need to use dynamic import for models if we are in module mode, or standard import
// Assuming we are in a module environment as per package.json "type": "module"
import connectDB from '../server/lib/db.js';
import Recipe from '../server/models/Recipe.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RECIPES_FILE = path.join(__dirname, '../recipes.json');

async function main() {
    console.log('Starting recipe cleanup and seed...');

    // 1. Connect to DB
    try {
        await connectDB();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }

    // 2. Read and Flatten Data
    const rawData = JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf-8'));
    const allLines = rawData.recipes.flatMap(r => r.ingredients);

    console.log(`Total lines to process: ${allLines.length}`);

    // 3. Parse Data
    const recipes = [];
    let currentRecipe = null;
    let section = 'NONE'; // NONE, INGREDIENTS, METHOD

    // Helper to save current recipe
    const optimizeRecipe = () => {
        if (currentRecipe && currentRecipe.name) {
            // Basic cleanup
            currentRecipe.name = currentRecipe.name.replace(/^\*_/, '').replace(/_\*$/, '').trim();

            // Defaults
            if (!currentRecipe.slug) {
                currentRecipe.slug = currentRecipe.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '') + '-' + Date.now();
            }

            // Filter empty ingredients
            currentRecipe.ingredients = currentRecipe.ingredients
                .filter(i => i.name && i.name.length > 2)
                .map(i => {
                    // Try to separate quantity if possible (basic heuristic)
                    // e.g. "1 cup flour" -> quantity: "1 cup", name: "flour"
                    // This is hard to do perfectly without NLP, so we'll just put it all in name for now
                    // unless it clearly starts with a number.
                    return i;
                });

            // Filter empty instructions
            currentRecipe.instructions = currentRecipe.instructions
                .filter(i => i.instruction && i.instruction.length > 2);

            if (currentRecipe.ingredients.length > 0 || currentRecipe.instructions.length > 0) {
                recipes.push(currentRecipe);
            }
        }
    };

    for (let i = 0; i < allLines.length; i++) {
        let line = allLines[i].trim();
        if (!line) continue;

        // NOISE FILTER
        const lowerLine = line.toLowerCase();
        if (line === 'Media omitted') continue;
        if (lowerLine.includes('joined using a group link')) continue;
        if (lowerLine.startsWith('welcome')) continue;
        if (lowerLine.includes('payment') && lowerLine.includes('inbox')) continue;
        if (line.startsWith('01/') || line.startsWith('02/') || line.startsWith('03/')) continue; // Dates

        // TITLE DETECTION
        // Pattern: *_Title_*
        const titleMatch = line.match(/^\*_(.+)_\*$/);
        const isExplicitTitle = !!titleMatch;

        // Heuristic for title: Short, capitalized, not a step
        const looksLikeTitle = !section.includes('METHOD') &&
            line.length < 60 &&
            line.length > 3 &&
            !line.includes('http') &&
            /^[A-Z]/.test(line) &&
            !line.endsWith('.') &&
            !['Ingredients', 'Method'].includes(line);

        // If we find a title (explicit or strong heuristic), saves current and starts new
        if (isExplicitTitle || (section === 'NONE' && looksLikeTitle)) {
            if (currentRecipe) {
                optimizeRecipe();
            }

            let name = titleMatch ? titleMatch[1] : line;

            // Extra validation on name
            if (name.toLowerCase().includes('payment') || name.length > 80) {
                // It's probably noise that looked like a title
                currentRecipe = null;
                section = 'NONE';
                continue;
            }

            currentRecipe = {
                name: name,
                ingredients: [],
                instructions: [],
                isVegetarian: true, // Inherit assumption
                category: 'Main Dish', // Default
                tags: [],
                stats: { view: 0, favorites: 0, averageRating: 0 }
            };
            section = 'NONE';
            continue;
        }

        // SECTION HEADERS
        if (line.match(/^\*?Ingredients/i) || line.includes('Ingredients:')) {
            section = 'INGREDIENTS';
            continue;
        }
        if (line.match(/^\*?Method/i) || line.match(/^\*?Directions/i) || line.match(/^\*?Preparation/i)) {
            section = 'METHOD';
            continue;
        }

        // CONTENT EXTRACTION
        if (currentRecipe) {
            if (section === 'INGREDIENTS') {
                // Clean bullets
                let cleanLine = line.replace(/^[-*•]\s*/, '').trim();
                if (cleanLine && cleanLine.length < 200) { // Limit length to avoid capturing paragraphs
                    // Check if it's actually a title disguised as an ingredient
                    if (/^\*_.+_\*$/.test(cleanLine)) {
                        // It's a title! Retrigger title logic for next loop? 
                        // Easier: just set section to NONE and reprocess this line (would need index decrement)
                        // For now, let's just ignore it as ingredient
                        continue;
                    }
                    currentRecipe.ingredients.push({ name: cleanLine, quantity: '' });
                }
            } else if (section === 'METHOD') {
                // Check if we hit a new title inside method without markers
                if (line.match(/^\*_.+_\*$/)) {
                    optimizeRecipe();
                    let name = line.match(/^\*_(.+)_\*$/)[1];
                    currentRecipe = {
                        name: name,
                        ingredients: [],
                        instructions: [],
                        isVegetarian: true,
                        category: 'Main Dish',
                        tags: [], // Re-init
                        stats: { view: 0, favorites: 0, averageRating: 0 }
                    };
                    section = 'NONE';
                    continue;
                }

                // Check if it's a numbered step
                const stepMatch = line.match(/^(\d+)[.)]\s*(.+)/);
                if (stepMatch) {
                    currentRecipe.instructions.push({
                        stepNumber: parseInt(stepMatch[1]),
                        instruction: stepMatch[2]
                    });
                } else {
                    // Append to last step or create new unnumbered
                    if (currentRecipe.instructions.length > 0) {
                        // Check if it's noise "Enjoy!"
                        if (line.includes('Enjoy')) continue;

                        currentRecipe.instructions.push({
                            stepNumber: currentRecipe.instructions.length + 1,
                            instruction: line
                        });
                    } else {
                        if (line.includes('Enjoy')) continue;
                        currentRecipe.instructions.push({
                            stepNumber: 1,
                            instruction: line
                        });
                    }
                }
            }
        } else {
            // No current recipe, and didn't match title regex.
            // Heuristic: If line is short and looks like a name, start a recipe
            if (line.length < 50 && !line.includes('http') && /[A-Z]/.test(line[0])) {
                // Start tentative recipe
                currentRecipe = {
                    name: line,
                    ingredients: [],
                    instructions: [],
                    isVegetarian: true,
                    slug: line.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
                };
                section = 'NONE'; // Wait for headers
            }
        }
    }

    // Save last one
    optimizeRecipe();

    console.log(`Found ${recipes.length} recipes.`);

    // 4. Seed Database
    if (recipes.length > 0) {
        console.log('Clearing existing recipes...');
        await Recipe.deleteMany({});

        console.log('Inserting new recipes...');
        // Batch insert or single?
        // Mongoose insertMany might fail on validation if data is dirty, let's try-catch blocks
        try {
            await Recipe.insertMany(recipes, { ordered: false });
            console.log('Successfully seeded database!');
        } catch (e) {
            console.error('Partial insertion error:', e.message);
            if (e.writeErrors) {
                console.log(`${e.writeErrors.length} documents failed validation.`);
            }
        }
    } else {
        console.log('No recipes found to seed.');
    }

    process.exit(0);
}

main();
