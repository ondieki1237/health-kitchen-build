"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function AdminSyncPage() {
  const [action, setAction] = useState("sync-area")
  const [area, setArea] = useState("Indian")
  const [category, setCategory] = useState("Vegetarian")
  const [limit, setLimit] = useState("10")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const vegetarianAreas = ["Indian", "Italian", "Mexican", "Thai", "Japanese", "Chinese", "Vietnamese", "Greek"]
  const vegetarianCategories = ["Vegetarian", "Side", "Pasta", "Dessert", "Breakfast", "Starter"]

  const handleSync = async () => {
    setLoading(true)
    setResult(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Error",
          description: "Please login first",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/sync/themealdb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          area: action === "sync-area" ? area : undefined,
          category: action === "sync-category" ? category : undefined,
          limit: parseInt(limit),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: "Success",
          description: "Sync completed successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Sync failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Sync error:", error)
      toast({
        title: "Error",
        description: "An error occurred during sync",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">TheMealDB Recipe Sync</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sync Configuration</CardTitle>
            <CardDescription>Import vegetarian recipes from TheMealDB API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sync Action</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sync-area">Sync by Area/Cuisine</SelectItem>
                  <SelectItem value="sync-category">Sync by Category</SelectItem>
                  <SelectItem value="sync-all">Sync All Areas</SelectItem>
                  <SelectItem value="random">Import Random Recipe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {action === "sync-area" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Area/Cuisine</label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vegetarianAreas.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {action === "sync-category" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vegetarianCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {action !== "random" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Limit (recipes per sync)</label>
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  min="1"
                  max="50"
                  placeholder="10"
                />
              </div>
            )}

            <Button onClick={handleSync} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Syncing..." : "Start Sync"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync Results</CardTitle>
            <CardDescription>View the results of your sync operation</CardDescription>
          </CardHeader>
          <CardContent>
            {!result && <p className="text-muted-foreground">No sync performed yet</p>}
            {result && (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Sync Complete!</h3>
                  {result.result && (
                    <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                      {result.result.synced !== undefined && <p>Recipes synced: {result.result.synced}</p>}
                      {result.result.skipped !== undefined && <p>Recipes skipped: {result.result.skipped}</p>}
                      {result.result.totalSynced !== undefined && <p>Total synced: {result.result.totalSynced}</p>}
                      {result.result.totalSkipped !== undefined && <p>Total skipped: {result.result.totalSkipped}</p>}
                    </div>
                  )}
                  {result.meal && (
                    <div className="mt-2">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Imported: <strong>{result.meal.name}</strong>
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{result.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About TheMealDB Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This tool imports vegetarian recipes from TheMealDB API. The system automatically filters out recipes
            containing meat, fish, or other non-vegetarian ingredients.
          </p>
          <p>
            <strong>Available Areas:</strong> {vegetarianAreas.join(", ")}
          </p>
          <p>
            <strong>Available Categories:</strong> {vegetarianCategories.join(", ")}
          </p>
          <p className="text-xs">
            Note: Using test API key (1). For production use, upgrade to a paid API key for higher rate limits.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
