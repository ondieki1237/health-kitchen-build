"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, ChefHat, Menu, LogOut, UtensilsCrossed, History, Calendar } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"

interface HeaderProps {
  user?: any
  onLogout?: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleNavigation = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#2e7d32]">Kitchen Guide</h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <>
              <Button
                variant="ghost"
                onClick={() => router.push("/planner")}
                className="flex items-center gap-2 text-gray-700 hover:text-[#2e7d32]"
              >
                <Calendar className="h-4 w-4" />
                Planner
              </Button>

              <Button
                variant="ghost"
                onClick={() => router.push("/profile/tried")}
                className="flex items-center gap-2 text-gray-700 hover:text-[#2e7d32]"
              >
                <History className="h-4 w-4" />
                My Tried Recipes
              </Button>

              <Button
                onClick={() => router.push("/menu/create")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ChefHat className="h-4 w-4" />
                Create Menu
              </Button>
              <span className="text-sm text-gray-700">Welcome, {user.username}</span>
            </>
          )}
          {onLogout && (
            <Button onClick={onLogout} className="bg-[#f57c00] hover:bg-[#e65100] text-white">
              Logout
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          {user && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader className="mb-6 text-left">
                  <SheetTitle>Menu</SheetTitle>
                  <p className="text-sm text-gray-500">Welcome, {user.username}</p>
                </SheetHeader>

                <div className="flex flex-col gap-4">
                  <Button
                    onClick={() => handleNavigation("/dashboard")}
                    variant="ghost"
                    className="justify-start gap-3 text-lg"
                  >
                    <UtensilsCrossed className="h-5 w-5" />
                    Browse Recipes
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/planner")}
                    variant="ghost"
                    className="justify-start gap-3 text-lg"
                  >
                    <Calendar className="h-5 w-5" />
                    Planner
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/menu/create")}
                    variant="ghost"
                    className="justify-start gap-3 text-lg"
                  >
                    <ChefHat className="h-5 w-5" />
                    Create Menu
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/profile/tried")}
                    variant="ghost"
                    className="justify-start gap-3 text-lg"
                  >
                    <History className="h-5 w-5" />
                    My Tried Recipes
                  </Button>

                  {onLogout && (
                    <Button
                      onClick={() => {
                        onLogout()
                        setOpen(false)
                      }}
                      className="bg-[#f57c00] hover:bg-[#e65100] text-white mt-4"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}
