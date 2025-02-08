import { NextResponse } from "next/server"

// Previous functions remain unchanged
function calculateCyclomaticComplexity(code: string): number {
  try {
    if (!code || typeof code !== "string") {
      console.log("Invalid input to calculateCyclomaticComplexity:", code)
      return 1
    }

    // Remove string literals and comments first
    const cleanCode = code.replace(/(["'])(?:(?=(\\?))\2.)*?\1|\/\/.*|\/\*[\s\S]*?\*\//g, "")

    // Count decision points
    let complexity = 1 // Base complexity

    // Control flow keywords and operators
    const patterns = [
      /\bif\b/g, // if statements
      /\belse\s+if\b/g, // else if statements
      /\bwhile\b/g, // while loops
      /\bfor\b/g, // for loops
      /\bcase\b/g, // case statements
      /\bcatch\b/g, // catch blocks
      /\breturn\b/g, // return statements (when inside conditions)
      /\?/g, // ternary operators
      /&&/g, // logical AND
      /\|\|/g, // logical OR
    ]

    // Count occurrences of each pattern
    patterns.forEach((pattern) => {
      const matches = cleanCode.match(pattern)
      if (matches) {
        complexity += matches.length
      }
    })

    console.log("Calculated complexity:", complexity)
    return complexity
  } catch (error) {
    console.error("Error in calculateCyclomaticComplexity:", {
      error,
      code: code?.substring(0, 100) + "...",
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    return 1
  }
}

function calculateDuplication(code: string): number {
  try {
    const lines = code.split("\n")
    const uniqueLines = new Set(lines)
    return 1 - uniqueLines.size / lines.length
  } catch (error) {
    console.error("Error in calculateDuplication:", error)
    return 0
  }
}

interface CodeSmell {
  category: string
  name: string
  description: string
  detected: boolean
}

function detectCodeSmells(code: string): CodeSmell[] {
  const cleanCode = code.replace(/\/\/.*|\/\*[\s\S]*?\*\/|'(?:\\.|[^\\'])*'|"(?:\\.|[^\\"])*"/g, "")
  const smells: CodeSmell[] = []

  // Bloaters
  const methodRegex = /\b(function|def)\s+\w+\s*$$[^)]*$$\s*{[\s\S]*?}/g
  const methods = code.match(methodRegex) || []
  methods.forEach((method) => {
    if (method.split("\n").length > 20) {
      smells.push({
        category: "Bloaters",
        name: "Long Method",
        description: "Method has more than 20 lines of code",
        detected: true,
      })
    }
    const params = method.match(/$$(.*?)$$/)?.[1] || ""
    if (params.split(",").length > 4) {
      smells.push({
        category: "Bloaters",
        name: "Long Parameter List",
        description: "Method has more than 4 parameters",
        detected: true,
      })
    }
  })

  const classRegex = /\b(class)\s+\w+\s*{[\s\S]*?}/g
  const classes = code.match(classRegex) || []
  classes.forEach((classCode) => {
    if (classCode.split("\n").length > 100) {
      smells.push({
        category: "Bloaters",
        name: "Large Class",
        description: "Class has more than 100 lines of code",
        detected: true,
      })
    }
  })

  // Object-Orientation Abusers
  if (cleanCode.match(/\bswitch\s*\(/g)) {
    smells.push({
      category: "Object-Orientation Abusers",
      name: "Switch Statements",
      description: "Switch statements found. Consider using polymorphism",
      detected: true,
    })
  }

  // Temporary Field detection
  const fieldRegex = /\b(private|protected|public)?\s+\w+\s+\w+\s*;/g
  const fields = code.match(fieldRegex) || []
  const methodUseRegex = new RegExp(fields.map((f) => f.split(/\s+/).pop()?.replace(";", "")).join("|"), "g")
  fields.forEach((field) => {
    const fieldName = field.split(/\s+/).pop()?.replace(";", "")
    if (fieldName && (code.match(new RegExp(fieldName, "g")) || []).length < 3) {
      smells.push({
        category: "Object-Orientation Abusers",
        name: "Temporary Field",
        description: "Field is used in very few places",
        detected: true,
      })
    }
  })

  // Change Preventers
  if (classes.length > 1) {
    const inheritanceRegex = /\bextends\b/g
    const inheritanceCount = (code.match(inheritanceRegex) || []).length
    if (inheritanceCount > 2) {
      smells.push({
        category: "Change Preventers",
        name: "Parallel Inheritance Hierarchies",
        description: "Multiple inheritance hierarchies detected",
        detected: true,
      })
    }
  }

  // Dispensables
  const commentRegex = /\/\/.*|\/\*[\s\S]*?\*\//g
  const comments = code.match(commentRegex) || []
  if (comments.length > code.split("\n").length * 0.3) {
    smells.push({
      category: "Dispensables",
      name: "Comments",
      description: "High ratio of comments to code",
      detected: true,
    })
  }

  // Duplicate code detection (simplified)
  const lines = code.split("\n")
  const duplicates = new Set()
  for (let i = 0; i < lines.length - 3; i++) {
    const chunk = lines.slice(i, i + 3).join("\n")
    if (chunk.length > 50 && code.indexOf(chunk) !== code.lastIndexOf(chunk)) {
      smells.push({
        category: "Dispensables",
        name: "Duplicate Code",
        description: "Similar code blocks found",
        detected: true,
      })
      break
    }
  }

  // Couplers
  const methodCallRegex = /\b\w+\.\w+\(/g
  const methodCalls = code.match(methodCallRegex) || []
  const methodCallCounts = new Map()
  methodCalls.forEach((call) => {
    const [obj, method] = call.split(".")
    methodCallCounts.set(obj, (methodCallCounts.get(obj) || 0) + 1)
  })
  methodCallCounts.forEach((count, obj) => {
    if (count > 5) {
      smells.push({
        category: "Couplers",
        name: "Feature Envy",
        description: `Class makes too many calls to ${obj}`,
        detected: true,
      })
    }
  })

  return smells
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Received body:", JSON.stringify(body).substring(0, 200) + "...")

    if (!body || typeof body.code !== "string") {
      return NextResponse.json({ error: "Invalid input: code must be a string" }, { status: 400 })
    }

    const { code } = body

    const cyclomaticComplexity = calculateCyclomaticComplexity(code)
    const duplicationRatio = calculateDuplication(code)
    const linesOfCode = code.split("\n").length
    const codeSmells = detectCodeSmells(code)

    // Group code smells by category
    const groupedSmells = codeSmells.reduce(
      (acc, smell) => {
        if (!acc[smell.category]) {
          acc[smell.category] = []
        }
        acc[smell.category].push(smell)
        return acc
      },
      {} as Record<string, CodeSmell[]>,
    )

    const smellsCount = codeSmells.length
    const technicalDebtRatio = (
      ((10 - Math.min(cyclomaticComplexity, 10)) / 10) * 0.3 +
      (1 - duplicationRatio) * 0.3 +
      (1 - Math.min(smellsCount / 10, 1)) * 0.4
    ).toFixed(2)

    const result = {
      cyclomaticComplexity,
      duplicationRatio: duplicationRatio.toFixed(2),
      linesOfCode,
      codeSmells: groupedSmells,
      smellsCount,
      technicalDebtRatio,
      assessment: Number(technicalDebtRatio) < 0.7 ? "High technical debt detected" : "Low technical debt detected",
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in analyze route:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}

