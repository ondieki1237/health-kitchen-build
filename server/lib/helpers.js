// Helper functions for the Health Kitchen app

/**
 * Generate a URL-friendly slug from text
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format cooking time to readable string
 */
export function formatCookingTime(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Calculate average rating
 */
export function calculateAverageRating(currentAvg, currentTotal, newRating) {
  const newTotal = currentTotal + 1;
  return (currentAvg * currentTotal + newRating) / newTotal;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, length = 100) {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + "...";
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Parse ingredient quantity from string
 */
export function parseIngredientQuantity(text) {
  const pattern = /^([\d\/\s]+(?:cup|tablespoon|teaspoon|tbsp|tsp|gram|g|oz|lb|piece|clove)?s?)\s+(.+)$/i;
  const match = text.match(pattern);

  if (match) {
    return {
      quantity: match[1].trim(),
      ingredient: match[2].trim(),
    };
  }

  return {
    quantity: "to taste",
    ingredient: text.trim(),
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get difficulty color class
 */
export function getDifficultyColor(difficulty) {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "text-green-600 bg-green-50";
    case "medium":
      return "text-yellow-600 bg-yellow-50";
    case "hard":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

/**
 * Get rating stars string
 */
export function getRatingStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return "⭐".repeat(fullStars) + (hasHalfStar ? "⭐" : "") + "☆".repeat(emptyStars);
}
