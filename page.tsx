"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react"

interface CodeSmell {
  category: string
  name: string
  description: string
  detected: boolean
}

type AnalysisResult = {
  cyclomaticComplexity: number
  duplicationRatio: string
  linesOfCode: number
  codeSmells: Record<string, CodeSmell[]>
  smellsCount: number
  technicalDebtRatio: string
  assessment: string
}

export default function Home() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const analyzeCode = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!code.trim()) {
        throw new Error("Please enter some code to analyze")
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze code")
      }

      setResult(data)
      // Initialize all categories as expanded
      if (data.codeSmells) {
        setExpandedCategories(
          Object.keys(data.codeSmells).reduce(
            (acc, category) => ({
              ...acc,
              [category]: true,
            }),
            {},
          ),
        )
      }
    } catch (err) {
      console.error("Error in analyzeCode:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Technical Debt Detector</h1>
      <Textarea
        placeholder="Paste your code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mb-4"
        rows={10}
      />
      <Button onClick={analyzeCode} disabled={isLoading}>
        {isLoading ? "Analyzing..." : "Analyze Code"}
      </Button>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {result && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Cyclomatic Complexity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{result.cyclomaticComplexity}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Duplication Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{result.duplicationRatio}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lines of Code</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{result.linesOfCode}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Code Smells Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{result.smellsCount}</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Code Smells</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(result.codeSmells).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(result.codeSmells).map(([category, smells]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <button
                        className="flex items-center justify-between w-full text-left font-semibold"
                        onClick={() => toggleCategory(category)}
                      >
                        <span>{category}</span>
                        {expandedCategories[category] ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      {expandedCategories[category] && (
                        <ul className="mt-2 space-y-2 pl-4">
                          {smells.map((smell, index) => (
                            <li key={index} className="text-sm">
                              <span className="font-medium">{smell.name}:</span> {smell.description}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No code smells detected.</p>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Technical Debt Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{result.technicalDebtRatio}</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl">{result.assessment}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}

