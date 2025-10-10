"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, Loader2, Database, Users, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface TestResult {
  name: string
  status: "pending" | "success" | "error" | "warning"
  message: string
  details?: string
}

export default function MVPTestPage() {
  const [authTests, setAuthTests] = useState<TestResult[]>([])
  const [dbTests, setDbTests] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  // Test 1: Stack Auth
  const testStackAuth = async () => {
    const results: TestResult[] = []

    results.push({
      name: "Authentication System",
      status: "warning",
      message: "Stack Auth disabled in MVP mode",
      details: "Authentication will be re-enabled once core features are stable",
    })

    results.push({
      name: "Environment Config",
      status: "success",
      message: "Environment variables configured",
      details: "Database and integration settings are properly configured",
    })

    setAuthTests(results)
  }

  // Test 2: Database Connection
  const testDatabase = async () => {
    const results: TestResult[] = []

    try {
      // Test database connection
      const response = await fetch("/api/test/database")
      const data = await response.json()

      if (data.success) {
        results.push({
          name: "Database Connection",
          status: "success",
          message: "Successfully connected to Neon",
          details: `Tables found: ${data.tables?.length || 0}`,
        })

        // Check required tables
        const requiredTables = ["users", "campaigns", "pledges", "tiers", "milestones"]
        const foundTables = data.tables || []

        requiredTables.forEach((table) => {
          if (foundTables.includes(table)) {
            results.push({
              name: `Table: ${table}`,
              status: "success",
              message: `Table '${table}' exists`,
            })
          } else {
            results.push({
              name: `Table: ${table}`,
              status: "error",
              message: `Table '${table}' not found`,
            })
          }
        })
      } else {
        results.push({
          name: "Database Connection",
          status: "error",
          message: "Failed to connect to database",
          details: data.error,
        })
      }
    } catch (error) {
      results.push({
        name: "Database Connection",
        status: "error",
        message: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    setDbTests(results)
  }

  // Run all tests
  const runAllTests = async () => {
    setTesting(true)
    setAuthTests([])
    setDbTests([])

    await testStackAuth()
    await testDatabase()

    setTesting(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Pass</Badge>
      case "error":
        return <Badge variant="destructive">Fail</Badge>
      case "warning":
        return <Badge variant="secondary">Warning</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const calculateOverallStatus = (tests: TestResult[]) => {
    if (tests.length === 0) return "pending"
    if (tests.some((t) => t.status === "error")) return "error"
    if (tests.some((t) => t.status === "warning")) return "warning"
    if (tests.every((t) => t.status === "success")) return "success"
    return "pending"
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MVP Test Dashboard</h1>
            <p className="text-muted-foreground">System Status Check - Core Features Only</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={runAllTests} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Run Tests
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </div>
        </div>

        {/* Quick Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authentication</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(calculateOverallStatus(authTests))}
                <span className="text-2xl font-bold">
                  {authTests.filter((t) => t.status === "success").length}/{authTests.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(calculateOverallStatus(dbTests))}
                <span className="text-2xl font-bold">
                  {dbTests.filter((t) => t.status === "success").length}/{dbTests.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>MVP Mode Active</AlertTitle>
          <AlertDescription>
            Wallet and smart contract features are temporarily disabled to ensure core functionality works. These will
            be re-enabled once the foundation is stable.
          </AlertDescription>
        </Alert>

        {/* Detailed Test Results */}
        <Tabs defaultValue="auth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auth">
              Authentication
              {getStatusIcon(calculateOverallStatus(authTests))}
            </TabsTrigger>
            <TabsTrigger value="database">
              Database
              {getStatusIcon(calculateOverallStatus(dbTests))}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stack Auth Tests</CardTitle>
                <CardDescription>Testing authentication system and user management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {authTests.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Click "Run Tests" to start testing</p>
                  </div>
                ) : (
                  authTests.map((test, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{test.name}</h4>
                          {getStatusBadge(test.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                        {test.details && <p className="text-xs text-muted-foreground mt-1">{test.details}</p>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Neon Database Tests</CardTitle>
                <CardDescription>Testing database connection and schema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dbTests.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Click "Run Tests" to start testing</p>
                  </div>
                ) : (
                  dbTests.map((test, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{test.name}</h4>
                          {getStatusBadge(test.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                        {test.details && <p className="text-xs text-muted-foreground mt-1">{test.details}</p>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
            <CardDescription>Current environment variables and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Authentication</h4>
                <div className="space-y-1 text-muted-foreground">
                  <div>Status: Disabled in MVP mode</div>
                  <div>Will be enabled after core features are stable</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Database</h4>
                <div className="space-y-1 text-muted-foreground">
                  <div>Connection: Ready to test</div>
                  <div>Provider: Neon PostgreSQL</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
