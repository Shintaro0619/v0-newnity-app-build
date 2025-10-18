/**
 * Convert UI amount (e.g., 123.45) to atomic USDC units (6 decimals)
 */
export function toAtomicUsdc(uiAmount: number): number {
  return Math.round(uiAmount * 1e6)
}

/**
 * Convert atomic USDC units to UI amount
 */
export function fromAtomicUsdc(atomic: number): number {
  return atomic / 1e6
}

/**
 * Check if a tier is currently available for selection
 * MVP: Simplified version without stock management
 */
export function isTierAvailable(
  tier: {
    starts_at?: string | null
    ends_at?: string | null
    is_active?: boolean
  },
  nowUtcSec: number,
): boolean {
  // Check if tier is active
  if (tier.is_active === false) return false

  // Check start time
  const started = !tier.starts_at || new Date(tier.starts_at).getTime() / 1000 <= nowUtcSec

  // Check end time
  const notEnded = !tier.ends_at || new Date(tier.ends_at).getTime() / 1000 >= nowUtcSec

  return started && notEnded
}

/**
 * Get tier availability status message
 * MVP: Simplified version without stock management
 */
export function getTierStatusMessage(
  tier: {
    starts_at?: string | null
    ends_at?: string | null
    is_active?: boolean
  },
  nowUtcSec: number,
): string | null {
  if (tier.is_active === false) return "Unavailable"

  const now = nowUtcSec * 1000

  if (tier.starts_at && new Date(tier.starts_at).getTime() > now) {
    return `Starts ${new Date(tier.starts_at).toLocaleDateString()}`
  }

  if (tier.ends_at && new Date(tier.ends_at).getTime() < now) {
    return "Ended"
  }

  return null
}

/**
 * Format USDC amount for display (no decimals for stablecoin)
 */
export function formatUSDC(amount: number | string): string {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return Math.floor(num).toString()
}
