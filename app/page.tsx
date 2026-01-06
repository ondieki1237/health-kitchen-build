"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SignupPage from "./signup/page"

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setIsAuthenticated(true)
      router.push("/dashboard")
    }
  }, [router])

  if (isAuthenticated) {
    return null
  }

  return <SignupPage />
}
