import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Recipe from "../models/Recipe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from root
dotenv.config({ path: join(__dirname, "../../.env") });

const analyze = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB.");

        const recipes = await Recipe.find({}, "name").lean();
        console.log(`Found ${recipes.length} recipes.`);

        const wordCounts = {};
        const stopWords = new Set(["with", "and", "the", "in", "a", "of", "to", "for", "on", "breast", "sauce", "pan", "style"]);

        recipes.forEach(r => {
            if (!r.name) return;
            const words = r.name.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
            words.forEach(w => {
                if (w.length < 3) return;
                if (stopWords.has(w)) return;
                wordCounts[w] = (wordCounts[w] || 0) + 1;
            });
        });

        const sorted = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50);

        console.log("Top 50 Keywords:");
        sorted.forEach(([word, count]) => {
            console.log(`${word}: ${count}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

analyze();
