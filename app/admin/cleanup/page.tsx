"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { deleteDummyCampaigns } from "@/lib/actions/campaigns"

export default function CleanupPage() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    deletedCount?: number
    deletedCampaigns?: Array<{ id: string; title: string }>
    error?: string
  } | null>(null)

  const handleDelete = async () => {
    if (!confirm("本当にダミーキャンペーン(blockchain_id IS NULL)を削除しますか？この操作は取り消せません。")) {
      return
    }

    setIsDeleting(true)
    setResult(null)

    try {
      const response = await deleteDummyCampaigns()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        error: String(error),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>ダミーキャンペーンの削除</CardTitle>
          <CardDescription>
            blockchain_idがnullのキャンペーン(オンチェーンにデプロイされていないもの)を削除します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleDelete} disabled={isDeleting} variant="destructive">
            {isDeleting ? "削除中..." : "ダミーキャンペーンを削除"}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg ${result.success ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}
            >
              {result.success ? (
                <div>
                  <p className="font-semibold">削除完了</p>
                  <p>削除されたキャンペーン数: {result.deletedCount}</p>
                  {result.deletedCampaigns && result.deletedCampaigns.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">削除されたキャンペーン:</p>
                      <ul className="list-disc list-inside">
                        {result.deletedCampaigns.map((campaign) => (
                          <li key={campaign.id}>{campaign.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-semibold">エラーが発生しました</p>
                  <p>{result.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
