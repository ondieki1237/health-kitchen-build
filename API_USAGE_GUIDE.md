# 🍽️ Health Kitchen - API & Feature Implementation Guide

A comprehensive plant-based nutrition platform with recipe management, menu planning, and social features.

## 🎯 What's Been Implemented

Based on the [API Database Integration Guide](./api_database_integration_guide.md), the following features have been fully implemented:

### ✅ Database Models (MongoDB)
- **Recipe Model** - Enhanced with stats, ratings, nutrition, tags
- **User Model** - With social stats, badges, saved items
- **Menu Model** - Meal planning with multiple meals
- **Comment Model** - Reviews, ratings, nested replies
- **CookingAttempt Model** - User cooking experiences
- **Notification Model** - Real-time user notifications

### ✅ API Endpoints

#### Recipes
- `GET /api/recipes` - List recipes with filters
- `POST /api/recipes` - Create new recipe
- `GET /api/recipes/[id]` - Get recipe details
- `POST /api/recipes/[id]/save` - Save/unsave recipe

#### Menus
- `GET /api/menus` - List menus
- `POST /api/menus` - Create menu
- `GET /api/menus/[id]` - Get menu details
- `PUT /api/menus/[id]` - Update menu
- `DELETE /api/menus/[id]` - Delete menu

#### Comments & Reviews
- `GET /api/comments` - Get comments
- `POST /api/comments` - Create comment
- `PUT /api/comments/[id]` - Update comment
- `DELETE /api/comments/[id]` - Delete comment
- `POST /api/comments/[id]` - Like/unlike comment

#### Cooking Attempts
- `GET /api/cooking-attempts` - List attempts
- `POST /api/cooking-attempts` - Log attempt
- `GET /api/cooking-attempts/[id]` - Get details
- `PUT /api/cooking-attempts/[id]` - Update
- `DELETE /api/cooking-attempts/[id]` - Delete

#### Users
- `GET /api/users/me` - Current user profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/[username]` - Public profile

#### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications` - Mark as read
- `DELETE /api/notifications` - Delete

#### Search & Discovery
- `GET /api/search` - Advanced search
- `POST /api/search` - Complex search
- `GET /api/search/filters` - Filter options

#### TheMealDB Integration
- `GET /api/sync/themealdb` - Sync options
- `POST /api/sync/themealdb` - Import recipes

### ✅ Pages & UI

- `/search` - Advanced recipe search with filters
- `/menu/create` - Menu builder interface
- `/menu/[id]` - Menu detail page
- `/admin/sync` - TheMealDB recipe import

### ✅ Services & Utilities

- **TheMealDB Service** - Complete API integration
- **Helper Functions** - Common utilities
- **Auth Utilities** - JWT authentication

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/health_kitchen
JWT_SECRET=your_super_secret_key_here
THEMEALDB_API_KEY=1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo

# Or use local MongoDB installation
mongod
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 Usage Examples

### Importing Recipes from TheMealDB

1. Navigate to `/admin/sync`
2. Choose sync action (by area, category, or all)
3. Set limit (number of recipes to import)
4. Click "Start Sync"

```bash
# Example API call
curl -X POST http://localhost:3000/api/sync/themealdb \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "sync-area",
    "area": "Indian",
    "limit": 10
  }'
```

### Creating a Menu

1. Navigate to `/menu/create`
2. Enter menu details
3. Search for recipes
4. Add recipes to different meal times
5. Click "Create Menu"

```bash
# Example API call
curl -X POST http://localhost:3000/api/menus \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Weekly Vegan Menu",
    "description": "Healthy plant-based meals",
    "type": "weekly",
    "meals": [
      {
        "mealTime": "breakfast",
        "recipe": "RECIPE_ID",
        "servings": 4
      }
    ]
  }'
```

### Advanced Recipe Search

Visit `/search` or use the API:

```bash
curl "http://localhost:3000/api/search?q=curry&isVegan=true&maxCookingTime=30&sortBy=stats.averageRating"
```

### Logging a Cooking Attempt

```bash
curl -X POST http://localhost:3000/api/cooking-attempts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "targetType": "Recipe",
    "targetId": "RECIPE_ID",
    "rating": 5,
    "review": "Amazing recipe!",
    "photos": ["url1", "url2"],
    "wouldMakeAgain": true
  }'
```

## 🔐 Authentication

### Sign Up

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "foodlover",
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

Response includes a JWT token. Use it in subsequent requests:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📊 Database Schema

All models use MongoDB with Mongoose ODM. Key features:

- Text search indexes on recipes
- Compound indexes for performance
- Automatic timestamps
- Relationship management
- Validation rules

## 🔍 Search Capabilities

### Text Search
Uses MongoDB's text index for full-text search on:
- Recipe name
- Description
- Tags

### Filters Available
- Category
- Cuisine
- Dietary preferences (vegan, vegetarian)
- Cooking time
- Difficulty level
- Rating
- Tags
- Ingredients (include/exclude)

### Sorting Options
- Newest
- Rating
- Most viewed
- Most saved
- Cooking time

## 🎨 Social Features

### Comments & Reviews
- Write reviews with ratings
- Upload photos of your cooking
- Share tips and modifications
- Reply to comments
- Like comments

### Cooking Attempts
- Log your cooking experiences
- Rate recipes
- Upload result photos
- Share modifications and tips
- Track what you've cooked

### Notifications
- Comment replies
- Likes on your content
- Recipe/menu features
- Badge achievements
- Cooking milestones

## 📱 API Response Examples

### Recipe List Response
```json
{
  "recipes": [
    {
      "_id": "...",
      "name": "Chickpea Curry",
      "description": "Delicious vegan curry",
      "category": "Main Dish",
      "cuisine": "Indian",
      "isVegan": true,
      "isVegetarian": true,
      "cookingTimeMinutes": 30,
      "stats": {
        "views": 150,
        "favorites": 25,
        "averageRating": 4.5,
        "totalRatings": 10
      }
    }
  ]
}
```

### Menu Response
```json
{
  "_id": "...",
  "name": "Weekly Vegan Menu",
  "type": "weekly",
  "meals": [
    {
      "mealTime": "breakfast",
      "recipe": {
        "_id": "...",
        "name": "Overnight Oats",
        "thumbnailUrl": "..."
      },
      "servings": 4
    }
  ],
  "createdBy": {
    "username": "healthchef",
    "displayName": "Health Chef"
  },
  "stats": {
    "views": 50,
    "favorites": 10,
    "averageRating": 4.8
  }
}
```

## 🛠️ Development Tips

### Adding New Models
1. Create model in `models/`
2. Add TypeScript types
3. Create API routes
4. Add to documentation

### Testing API Endpoints
Use the included examples or tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code)

### Database Indexes
Critical for performance. Already configured:
- Text search on recipes
- User lookups
- Date-based queries
- Stats aggregations

## 🚢 Production Deployment

### Environment Variables
- Set `JWT_SECRET` to a strong random string
- Use production MongoDB URI
- Upgrade TheMealDB API key if needed
- Configure CORS properly
- Set up SSL/HTTPS

### Performance Optimization
- Enable Redis caching (optional)
- Use CDN for images (Cloudinary recommended)
- Enable compression
- Monitor with APM tools
- Set up database indexes

### Security Checklist
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation
- ✅ Rate limiting (configure in production)
- ✅ CORS configuration
- ✅ Environment variable protection

## 📖 Additional Documentation

- [API Database Integration Guide](./api_database_integration_guide.md) - Complete technical guide
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - What's been built

## 🤝 Contributing

This is an open-source project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 💬 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Check the documentation
- Review API examples

---

**Built with 💚 for healthy eating and plant-based living**

*Updated: January 5, 2026*
