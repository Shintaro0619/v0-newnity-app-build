"use client"
import dynamic from "next/dynamic"

const AnalyticsContent = dynamic(() => import("./analytics-content"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  ),
})

export default function AnalyticsPage() {
  return <AnalyticsContent />
}
