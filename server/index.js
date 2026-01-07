import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import authRoutes from "./routes/auth/index.js";
import recipeRoutes from "./routes/recipes/index.js";
import menuRoutes from "./routes/menus/index.js";
import commentRoutes from "./routes/comments/index.js";
import cookingAttemptRoutes from "./routes/cooking-attempts/index.js";
import notificationRoutes from "./routes/notifications/index.js";
import userRoutes from "./routes/users/index.js";
import searchRoutes from "./routes/search/index.js";
import syncRoutes from "./routes/sync/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3900;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_FRONTEND_URL,
      "http://localhost:3000",
      "https://health-kitchen-build.vercel.app",
      "https://kitchen.codewithseth.co.ke"
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && !origin.includes("vercel.app")) {
      // Temporarily allow all vercel.app subdomains for preview deployments
      // return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/cooking-attempts", cookingAttemptRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/sync", syncRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Health Kitchen API"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Health Kitchen API server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});
