/**
 * Convert hours (1-12) and minutes (0-59) to clock hand angles in degrees.
 * 12 o'clock = 0 degrees, clockwise.
 */
export function timeToAngles(hours: number, minutes: number): { hourAngle: number; minuteAngle: number } {
  const h = hours % 12
  const minuteAngle = (minutes / 60) * 360
  const hourAngle = (h / 12) * 360 + (minutes / 60) * 30
  return { hourAngle, minuteAngle }
}

/**
 * Convert hand angles back to hours and minutes.
 */
export function anglesToTime(hourAngle: number, minuteAngle: number): { hours: number; minutes: number } {
  let minutes = Math.round((minuteAngle / 360) * 60) % 60
  if (minutes < 0) minutes += 60

  let hours = Math.round((hourAngle / 360) * 12) % 12
  if (hours <= 0) hours += 12

  return { hours, minutes }
}

/**
 * Snap angle to nearest multiple of snapDegrees.
 */
export function snapAngle(angle: number, snapDegrees: number): number {
  return Math.round(angle / snapDegrees) * snapDegrees
}

/**
 * Calculate angle from center (cx, cy) to point (px, py).
 * Returns degrees where 12 o'clock = 0, clockwise positive.
 */
export function pointerToAngle(cx: number, cy: number, px: number, py: number): number {
  const dx = px - cx
  const dy = py - cy
  // atan2 gives angle from positive x-axis, counter-clockwise
  // We want angle from negative y-axis (12 o'clock), clockwise
  let angle = (Math.atan2(dx, -dy) * 180) / Math.PI
  if (angle < 0) angle += 360
  return angle
}

/**
 * Get snap degrees based on difficulty.
 */
export function getSnapDegrees(difficulty: string): number {
  switch (difficulty) {
    case 'hour': return 30       // 12 positions
    case 'half': return 15       // unused for minute hand; hour snaps to 30
    case 'quarter': return 90    // 4 positions for minute hand
    case 'five_min': return 30   // 12 positions for minute hand
    case 'one_min': return 6     // 60 positions
    default: return 6
  }
}

/**
 * Format time as "H:MM" string.
 */
export function formatTime(hours: number, minutes: number): string {
  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Format time in spoken English for display.
 */
export function formatTimeWords(hours: number, minutes: number): string {
  if (minutes === 0) return `${hours} o'clock`
  if (minutes === 15) return `quarter past ${hours}`
  if (minutes === 30) return `half past ${hours}`
  if (minutes === 45) return `quarter to ${hours === 12 ? 1 : hours + 1}`
  return formatTime(hours, minutes)
}
