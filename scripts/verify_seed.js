import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../server/lib/db.js';
import Recipe from '../server/models/Recipe.js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function verify() {
    await connectDB();
    const count = await Recipe.countDocuments();
    console.log(`Current recipe count: ${count}`);

    const sample = await Recipe.findOne({}).sort({ createdAt: -1 });
    if (sample) {
        console.log('Sample Recipe:');
        console.log(JSON.stringify(sample, null, 2));
    } else {
        console.log('No recipes found.');
    }
    process.exit();
}

verify();
