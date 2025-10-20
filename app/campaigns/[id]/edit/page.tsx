"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"

const EditCampaignForm = dynamic(() => import("@/components/campaigns/edit-campaign-form"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <Card>
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="h-12 bg-muted animate-pulse rounded" />
                <div className="h-12 bg-muted animate-pulse rounded" />
                <div className="h-32 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
})

export default function EditCampaignPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditCampaignForm />
    </Suspense>
  )
}
