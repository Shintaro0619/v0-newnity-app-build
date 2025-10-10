"use client"

import { useState } from "react"
import Link from "next/link"

export default function SimpleTestPage() {
  const [dbTest, setDbTest] = useState<{ status: string; message: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const testDatabase = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/test/database")
      const data = await response.json()

      if (data.success) {
        setDbTest({
          status: "success",
          message: `✓ Database connected! Found ${data.tables?.length || 0} tables`,
        })
      } else {
        setDbTest({
          status: "error",
          message: `✗ Database error: ${data.error}`,
        })
      }
    } catch (error) {
      setDbTest({
        status: "error",
        message: `✗ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }
    setTesting(false)
  }

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>Simple Test Page</h1>
        <p style={{ color: "#666", marginBottom: "2rem" }}>Basic functionality test without complex dependencies</p>

        <div
          style={{
            padding: "1.5rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginBottom: "1rem",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Database Connection Test</h2>

          <button
            onClick={testDatabase}
            disabled={testing}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: testing ? "#ccc" : "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: testing ? "not-allowed" : "pointer",
              fontSize: "1rem",
              marginBottom: "1rem",
            }}
          >
            {testing ? "Testing..." : "Run Database Test"}
          </button>

          {dbTest && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "4px",
                backgroundColor: dbTest.status === "success" ? "#d4edda" : "#f8d7da",
                color: dbTest.status === "success" ? "#155724" : "#721c24",
                border: `1px solid ${dbTest.status === "success" ? "#c3e6cb" : "#f5c6cb"}`,
              }}
            >
              {dbTest.message}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "1.5rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Environment Variables</h2>
          <div style={{ fontSize: "0.875rem", color: "#666" }}>
            <div style={{ marginBottom: "0.5rem" }}>
              Database URL: {process.env.DATABASE_URL ? "✓ Set" : "✗ Missing"}
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              Neon Project ID: {process.env.NEON_PROJECT_ID ? "✓ Set" : "✗ Missing"}
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              Stack Project ID: {process.env.NEXT_PUBLIC_STACK_PROJECT_ID ? "✓ Set" : "✗ Missing"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <Link
            href="/"
            style={{
              color: "#0070f3",
              textDecoration: "underline",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
