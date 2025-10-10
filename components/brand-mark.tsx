interface BrandMarkProps {
  className?: string
  size?: number
}

export function BrandMark({ className = "", size = 32 }: BrandMarkProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          <rect width="32" height="32" rx="6" fill="currentColor" fillOpacity="0.1" />
          <path d="M8 22V10h3.5l5 8V10h3v12h-3.5l-5-8v8H8z" fill="currentColor" className="text-primary" />
        </svg>
      </div>
    </div>
  )
}
