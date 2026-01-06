"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2e7d32] mb-2">Kitchen Guide</h1>
            <p className="text-gray-500">Welcome back</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20]">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#2e7d32] font-semibold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#2e7d32] to-[#1b5e20] text-white items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Your Kitchen Awaits</h2>
          <p className="text-lg mb-8 opacity-90">
            Access your saved recipes and discover new culinary inspirations every day.
          </p>
          <ul className="space-y-3 text-left">
            <li className="flex items-center gap-2">
              <span className="text-2xl">✓</span> Quick recipe access
            </li>
            <li className="flex items-center gap-2">
              <span className="text-2xl">✓</span> Your favorite recipes
            </li>
            <li className="flex items-center gap-2">
              <span className="text-2xl">✓</span> Meal planning tools
            </li>
            <li className="flex items-center gap-2">
              <span className="text-2xl">✓</span> Community recipes
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
