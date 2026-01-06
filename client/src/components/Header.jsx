"use client"
import { useNavigate } from "react-router-dom"
import "../styles/header.css"

export default function Header({ user, onLogout }) {
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1 onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
            Kitchen Guide
          </h1>
        </div>

        <div className="header-right">
          {user && <span className="user-name">Welcome, {user.username}</span>}
          {onLogout && (
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
