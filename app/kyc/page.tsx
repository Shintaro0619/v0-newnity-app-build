import dynamic from "next/dynamic"

const KYCContent = dynamic(() => import("./kyc-content"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  ),
})

export default function KYCPage() {
  return <KYCContent />
}
