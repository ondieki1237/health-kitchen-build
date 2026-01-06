# Kitchen Guide - Full Stack App

A beautiful, full-featured kitchen guide application built with Node.js, Express, MongoDB, and React.

## Features

- **User Authentication**: Secure signup and login with JWT tokens
- **Recipe Discovery**: Browse and search recipes with multiple filters
- **Responsive Design**: Mobile-first approach optimized for all devices
- **Dietary Preferences**: Filter recipes by vegetarian, vegan, and other preferences
- **Recipe Details**: View complete recipe information including ingredients and instructions
- **User Profiles**: Personalized user experience with saved preferences

## Tech Stack

### Backend
- Node.js & Express
- MongoDB with Mongoose ODM
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18
- React Router for navigation
- CSS3 for styling
- Responsive design patterns

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd kitchen-guide-app
   ```

2. **Setup Backend**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB connection string and JWT secret
   npm run dev
   ```

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd client
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
kitchen-guide-app/
├── models/
│   ├── User.js
│   └── Recipe.js
├── routes/
│   ├── auth.js
│   └── recipes.js
├── server.js
├── package.json
└── client/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── styles/
    │   └── App.jsx
    └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to account
- `GET /api/auth/me` - Get current user (protected)

### Recipes
- `GET /api/recipes` - Get all recipes with filters
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create new recipe (protected)
- `POST /api/recipes/:id/like` - Like/unlike recipe (protected)

## Color Palette

- Primary: #2E7D32 (Leaf Green)
- Secondary: #66BB6A (Fresh Lime)
- Accent: #F57C00 (Carrot Orange)
- Background: #F9FAF7 (Off White)
- Text: #263238 (Charcoal)
- Muted: #B0BEC5 (Warm Grey)

## License

MIT
