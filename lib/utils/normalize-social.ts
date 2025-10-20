/**
 * Normalize social media links
 * Converts @handles and partial URLs to full URLs
 */
export function normalizeSocialLinks(input: {
  website?: string
  x?: string
  instagram?: string
  youtube?: string
  tiktok?: string
}): {
  website?: string
  x?: string
  instagram?: string
  youtube?: string
  tiktok?: string
} {
  const normalizeUrl = (value: string | undefined, platform: string): string | undefined => {
    if (!value) return undefined

    let url = value.trim()
    if (!url) return undefined

    // Remove @ prefix if present
    if (url.startsWith("@")) {
      url = url.slice(1)
    }

    // If already a full URL, return as is
    if (/^https?:\/\//i.test(url)) {
      return url
    }

    // Platform-specific URL construction
    switch (platform) {
      case "x":
        // Handle x.com or twitter.com
        if (url.includes("x.com") || url.includes("twitter.com")) {
          return `https://${url}`
        }
        return `https://x.com/${url}`

      case "instagram":
        if (url.includes("instagram.com")) {
          return `https://${url}`
        }
        return `https://instagram.com/${url}`

      case "youtube":
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          return `https://${url}`
        }
        return `https://youtube.com/@${url}`

      case "tiktok":
        if (url.includes("tiktok.com")) {
          return `https://${url}`
        }
        return `https://tiktok.com/@${url}`

      case "website":
        // For website, if it doesn't start with http, add https
        if (!url.startsWith("http")) {
          return `https://${url}`
        }
        return url

      default:
        return url
    }
  }

  return {
    website: normalizeUrl(input.website, "website"),
    x: normalizeUrl(input.x, "x"),
    instagram: normalizeUrl(input.instagram, "instagram"),
    youtube: normalizeUrl(input.youtube, "youtube"),
    tiktok: normalizeUrl(input.tiktok, "tiktok"),
  }
}
