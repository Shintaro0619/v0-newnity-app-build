/**
 * Convert USD to USDC atomic units (6 decimals)
 * @param usd - Amount in USD
 * @returns Amount in USDC atomic units
 */
export const usdToUsdc = (usd: number): number => {
  return Math.round(usd * 1_000_000)
}

/**
 * Convert USDC atomic units to USD
 * @param usdc - Amount in USDC atomic units (6 decimals)
 * @returns Amount in USD
 */
export const usdcToUsd = (usdc: number): number => {
  return usdc / 1_000_000
}
