"use client"
import "../styles/recipe-card.css"

export default function RecipeCard({ recipe, onClick }) {
  return (
    <div className="recipe-card" onClick={onClick}>
      {recipe.imageUrl && (
        <div className="recipe-image-container">
          <img src={recipe.imageUrl || "/placeholder.svg"} alt={recipe.name} />
          <div className="recipe-overlay">
            <button className="view-button">View Recipe</button>
          </div>
        </div>
      )}

      <div className="recipe-card-body">
        <h3>{recipe.name}</h3>

        {recipe.category && <p className="category">{recipe.category}</p>}

        <div className="recipe-card-footer">
          <div className="tags">
            {recipe.isVegan && <span className="tag-small vegan">Vegan</span>}
            {recipe.isVegetarian && <span className="tag-small vegetarian">Vegetarian</span>}
          </div>

          {recipe.cookingTimeMinutes && <span className="cooking-time">{recipe.cookingTimeMinutes}m</span>}
        </div>
      </div>
    </div>
  )
}
