"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import RecipeCard from "../components/RecipeCard"
import Header from "../components/Header"
import "../styles/dashboard.css"

export default function DashboardPage({ user, onLogout }) {
  const [recipes, setRecipes] = useState([])
  const [filteredRecipes, setFilteredRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    isVegetarian: false,
    isVegan: false,
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchRecipes()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [recipes, filters])

  const fetchRecipes = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/recipes")
      const data = await response.json()
      setRecipes(data)
      setFilteredRecipes(data)
    } catch (error) {
      console.error("Error fetching recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = recipes

    if (filters.search) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          (r.description && r.description.toLowerCase().includes(filters.search.toLowerCase())),
      )
    }

    if (filters.category) {
      filtered = filtered.filter((r) => r.category === filters.category)
    }

    if (filters.isVegetarian) {
      filtered = filtered.filter((r) => r.isVegetarian)
    }

    if (filters.isVegan) {
      filtered = filtered.filter((r) => r.isVegan)
    }

    setFilteredRecipes(filtered)
  }

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipe/${recipeId}`)
  }

  const handleLogout = () => {
    onLogout()
    navigate("/login")
  }

  return (
    <div className="dashboard">
      <Header user={user} onLogout={handleLogout} />

      <div className="dashboard-container">
        <div className="filters-section">
          <h2>Find Recipes</h2>

          <div className="search-box">
            <input
              type="text"
              name="search"
              placeholder="Search recipes..."
              value={filters.search}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>
              <input type="checkbox" name="isVegetarian" checked={filters.isVegetarian} onChange={handleFilterChange} />
              Vegetarian Only
            </label>
            <label>
              <input type="checkbox" name="isVegan" checked={filters.isVegan} onChange={handleFilterChange} />
              Vegan Only
            </label>
          </div>

          <div className="category-select">
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              <option value="Main Dish">Main Dish</option>
              <option value="Appetizer">Appetizer</option>
              <option value="Dessert">Dessert</option>
              <option value="Soup">Soup</option>
              <option value="Salad">Salad</option>
            </select>
          </div>
        </div>

        <div className="recipes-section">
          {loading ? (
            <div className="loading">Loading recipes...</div>
          ) : filteredRecipes.length > 0 ? (
            <div className="recipes-grid">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe._id} recipe={recipe} onClick={() => handleRecipeClick(recipe._id)} />
              ))}
            </div>
          ) : (
            <div className="no-recipes">
              <p>No recipes found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
