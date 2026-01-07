"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, ChefHat } from "lucide-react"

interface HeaderProps {
  user?: any
  onLogout?: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#2e7d32]">Kitchen Guide</h1>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <Button
                onClick={() => router.push("/menu/create")}
                variant="outline"
                className="hidden md:flex items-center gap-2"
              >
                <ChefHat className="h-4 w-4" />
                Create Menu
              </Button>
              <span className="text-sm text-gray-700 hidden md:inline">Welcome, {user.username}</span>
            </>
          )}
          {onLogout && (
            <Button onClick={onLogout} className="bg-[#f57c00] hover:bg-[#e65100] text-white">
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
