# Health Kitchen - Setup & Running Guide

## ✅ Setup Complete!

Your Health Kitchen application is now configured with:
- **Backend**: Express server on port **3900**
- **Frontend**: Next.js application on port **3000**
- **Database**: MongoDB Atlas (configured)
- **External Services**: TheMealDB API, Cloudinary, Gmail SMTP

## 🚀 Running the Application

### Option 1: Run Both Servers Together (Recommended)
```bash
npm run dev:all
```

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3900/api
- **Health Check**: http://localhost:3900/api/health

## 📋 Environment Variables

Your `.env` file is configured with:
- MongoDB Atlas connection
- JWT authentication secret
- TheMealDB API key
- Cloudinary credentials
- Gmail SMTP settings
- Application URLs

## 🔍 Testing the Backend

Test the API health endpoint:
```bash
curl http://localhost:3900/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-05T...",
  "service": "Health Kitchen API"
}
```

## 📁 Project Structure

```
health-kitchen-build/
├── server/              # Backend Express server
│   ├── index.js        # Server entry point
│   ├── lib/           # Utilities (db, auth, themealdb)
│   ├── middleware/    # Express middleware
│   ├── models/        # Mongoose models
│   └── routes/        # API routes
├── app/               # Next.js frontend
├── components/        # React components
└── .env              # Environment variables
```

## 🔧 Available Scripts

- `npm run dev:all` - Run both frontend and backend
- `npm run dev:frontend` - Run Next.js frontend only
- `npm run dev:backend` - Run Express backend only
- `npm run build` - Build Next.js for production
- `npm run start` - Start Next.js production server
- `npm run start:backend` - Start Express backend (production)

## 📚 API Documentation

Full API documentation available in `server/README.md`

Key endpoints:
- `/api/auth/signup` - Register
- `/api/auth/login` - Login
- `/api/recipes` - Recipe CRUD
- `/api/menus` - Menu management
- `/api/search` - Advanced search
- `/api/sync/themealdb/*` - Import recipes

## 🎉 You're Ready!

The backend is already running on port 3900. Start the frontend with:
```bash
npm run dev:frontend
```

Then visit http://localhost:3000 to use the application!
