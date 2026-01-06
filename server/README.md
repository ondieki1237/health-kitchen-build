# Health Kitchen - Backend Server

## Architecture
- **Frontend**: Next.js application running on port 3000
- **Backend**: Express API server running on port 3900

## Running the Application

### Option 1: Run Both Servers Simultaneously
```bash
npm run dev:all
```

### Option 2: Run Servers Separately

**Backend Only:**
```bash
npm run dev:backend
# or
cd server && node index.js
```

**Frontend Only:**
```bash
npm run dev:frontend
```

## API Endpoints

All backend APIs are available at `http://localhost:3900/api`

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Recipes
- `GET /api/recipes` - Get all recipes (with filters)
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create recipe (auth required)
- `PUT /api/recipes/:id` - Update recipe (auth required)
- `DELETE /api/recipes/:id` - Delete recipe (auth required)
- `POST /api/recipes/:id/like` - Like/unlike recipe (auth required)
- `POST /api/recipes/:id/save` - Save/unsave recipe (auth required)

### Menus, Comments, Cooking Attempts, Notifications, Users, Search, and Sync
See full API documentation in the main README.

## Health Check
`http://localhost:3900/api/health`
