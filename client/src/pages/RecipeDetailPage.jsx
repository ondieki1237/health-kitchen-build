"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Header from "../components/Header"
import "../styles/recipe-detail.css"

export default function RecipeDetailPage({ user }) {
  const { id } = useParams()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    fetchRecipe()
  }, [id])

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${id}`)
      if (!response.ok) throw new Error("Recipe not found")
      const data = await response.json()
      setRecipe(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading recipe...</div>
  if (error) return <div className="error">{error}</div>
  if (!recipe) return <div className="error">Recipe not found</div>

  return (
    <div className="recipe-detail">
      <Header user={user} />

      <div className="recipe-container">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to Recipes
        </button>

        <div className="recipe-header">
          {recipe.imageUrl && (
            <img src={recipe.imageUrl || "/placeholder.svg"} alt={recipe.name} className="recipe-image" />
          )}
          <div className="recipe-info">
            <h1>{recipe.name}</h1>
            {recipe.description && <p className="description">{recipe.description}</p>}

            <div className="recipe-meta">
              {recipe.difficultyLevel && (
                <span className="meta-item">
                  <strong>Difficulty:</strong> {recipe.difficultyLevel}
                </span>
              )}
              {recipe.cookingTimeMinutes && (
                <span className="meta-item">
                  <strong>Time:</strong> {recipe.cookingTimeMinutes} mins
                </span>
              )}
              {recipe.servingSize && (
                <span className="meta-item">
                  <strong>Servings:</strong> {recipe.servingSize}
                </span>
              )}
            </div>

            <div className="recipe-tags">
              {recipe.isVegan && <span className="tag vegan">Vegan</span>}
              {recipe.isVegetarian && <span className="tag vegetarian">Vegetarian</span>}
            </div>
          </div>
        </div>

        <div className="recipe-content">
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <section className="ingredients-section">
              <h2>Ingredients</h2>
              <ul className="ingredients-list">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx}>
                    <span className="quantity">
                      {ing.quantity} {ing.measurement}
                    </span>
                    <span className="ingredient-name">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recipe.instructions && recipe.instructions.length > 0 && (
            <section className="instructions-section">
              <h2>Instructions</h2>
              <ol className="instructions-list">
                {recipe.instructions.map((instruction, idx) => (
                  <li key={idx}>{instruction}</li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
