#!/bin/bash

# Health Kitchen Quick Start Script
# This script helps set up and run the Health Kitchen application

echo "🍽️  Health Kitchen - Quick Start"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo "✅ Created .env.local - Please update with your configuration"
    echo ""
    echo "📝 Edit .env.local and set:"
    echo "   - MONGODB_URI (your MongoDB connection string)"
    echo "   - JWT_SECRET (a secure random string)"
    echo ""
    read -p "Press Enter to continue once you've configured .env.local..."
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
# Try to extract MongoDB URI from .env.local
MONGODB_URI=$(grep MONGODB_URI .env.local | cut -d '=' -f2)
if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  MongoDB URI not set in .env.local"
    echo "   Using default: mongodb://localhost:27017/health_kitchen"
else
    echo "   MongoDB URI: $MONGODB_URI"
fi

echo ""
echo "🚀 Starting development server..."
echo ""
echo "Available pages:"
echo "   - http://localhost:3000 (Home)"
echo "   - http://localhost:3000/search (Search Recipes)"
echo "   - http://localhost:3000/menu/create (Create Menu)"
echo "   - http://localhost:3000/admin/sync (Import Recipes)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev
