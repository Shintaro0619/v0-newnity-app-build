/**
 * Date utility functions for campaign deadline handling
 *
 * MVP Approach: Date-only input → normalize to UTC 23:59:59
 * Future: Add time + timezone input capability
 */

/**
 * Normalizes a date to UTC 23:59:59 (end of day)
 * This ensures campaigns end at the end of the specified day in UTC
 *
 * @param date - Date object or ISO string
 * @returns UNIX timestamp (seconds) for UTC 23:59:59 of that date
 */
export function normalizeDateToUTCEndOfDay(date: Date | string): number {
  const dateObj = typeof date === "string" ? new Date(date) : date

  // Create a new date in UTC with time set to 23:59:59
  const utcDate = new Date(
    Date.UTC(
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth(),
      dateObj.getUTCDate(),
      23, // hours
      59, // minutes
      59, // seconds
    ),
  )

  // Return UNIX timestamp in seconds (blockchain uses seconds)
  return Math.floor(utcDate.getTime() / 1000)
}

/**
 * Calculates end date from start date and duration in days
 * Normalizes to UTC 23:59:59
 *
 * @param startDate - Campaign start date
 * @param durationDays - Campaign duration in days
 * @returns UNIX timestamp (seconds) for the deadline
 */
export function calculateDeadline(startDate: Date, durationDays: number): number {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + durationDays)

  return normalizeDateToUTCEndOfDay(endDate)
}

/**
 * Formats a UNIX timestamp for display
 * Shows both local time and UTC for clarity
 *
 * @param timestamp - UNIX timestamp in seconds
 * @returns Formatted string with local and UTC times
 */
export function formatDeadline(timestamp: number): {
  local: string
  utc: string
  localDate: string
  utcDate: string
} {
  const date = new Date(timestamp * 1000)

  return {
    local: date.toLocaleString(),
    utc: date.toUTCString(),
    localDate: date.toLocaleDateString(),
    utcDate: date.toLocaleDateString("en-US", { timeZone: "UTC" }),
  }
}

/**
 * Checks if a deadline has passed
 *
 * @param timestamp - UNIX timestamp in seconds
 * @returns true if deadline has passed
 */
export function isDeadlinePassed(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  return now >= timestamp
}

/**
 * Calculates days remaining until deadline
 *
 * @param timestamp - UNIX timestamp in seconds
 * @returns Number of days remaining (can be negative if passed)
 */
export function getDaysRemaining(timestamp: number): number {
  const now = Math.floor(Date.now() / 1000)
  const secondsRemaining = timestamp - now
  return Math.ceil(secondsRemaining / (24 * 60 * 60))
}
