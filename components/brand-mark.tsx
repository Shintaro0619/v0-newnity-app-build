interface BrandMarkProps {
  className?: string
  size?: number
}

export function BrandMark({ className = "", size = 32 }: BrandMarkProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img src="/newnity-logo.png" alt="newnity" width={size} height={size} className="object-contain" />
    </div>
  )
}
