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
 * Result is normalised to [0, 360) so 360° becomes 0°.
 */
export function snapAngle(angle: number, snapDegrees: number): number {
  const snapped = Math.round(angle / snapDegrees) * snapDegrees
  return snapped % 360
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
 * Format time in spoken English for display (legacy — used by InteractiveClock).
 */
export function formatTimeWords(hours: number, minutes: number): string {
  if (minutes === 0) return `${hours} o'clock`
  if (minutes === 15) return `quarter past ${hours}`
  if (minutes === 30) return `half past ${hours}`
  if (minutes === 45) return `quarter to ${hours === 12 ? 1 : hours + 1}`
  return formatTime(hours, minutes)
}

// --- Time Format System ---

export type TimeFormat = 'digital' | 'digital_ampm' | 'words_past_to' | 'full_words'

const NUMBER_WORDS = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two',
  'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven',
  'twenty-eight', 'twenty-nine', 'thirty',
]

function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}

function nextHour(h: number): number {
  return h === 12 ? 1 : h + 1
}

/**
 * Render time as "past / to" phrase using numbers for hours.
 * E.g. "quarter past 3", "20 to 8", "5 o'clock"
 */
function formatPastTo(hours: number, minutes: number): string {
  if (minutes === 0) return `${hours} o'clock`
  if (minutes === 15) return `quarter past ${hours}`
  if (minutes === 30) return `half past ${hours}`
  if (minutes === 45) return `quarter to ${nextHour(hours)}`
  if (minutes <= 30) return `${minutes} past ${hours}`
  return `${60 - minutes} to ${nextHour(hours)}`
}

/**
 * Render time as full English words.
 * E.g. "quarter past three", "twenty to eight", "five o'clock"
 */
function formatFullWords(hours: number, minutes: number): string {
  const h = numberWord(hours)
  if (minutes === 0) return `${h} o'clock`
  if (minutes === 15) return `quarter past ${h}`
  if (minutes === 30) return `half past ${h}`
  if (minutes === 45) return `quarter to ${numberWord(nextHour(hours))}`
  if (minutes <= 30) return `${numberWord(minutes)} past ${h}`
  return `${numberWord(60 - minutes)} to ${numberWord(nextHour(hours))}`
}

/**
 * Render time in the specified format.
 * Pass ampm for digital_ampm format to keep it consistent across a question.
 */
export function formatTimeAs(hours: number, minutes: number, format: TimeFormat, ampm: 'AM' | 'PM' = 'AM'): string {
  switch (format) {
    case 'digital':
      return formatTime(hours, minutes)
    case 'digital_ampm':
      return `${formatTime(hours, minutes)} ${ampm}`
    case 'words_past_to':
      return formatPastTo(hours, minutes)
    case 'full_words':
      return formatFullWords(hours, minutes)
  }
}

/**
 * Pick a random time format based on weighted proportions.
 * Returns the format and a random AM/PM value for consistent use.
 */
export function pickTimeFormat(mix: Record<string, number>): { format: TimeFormat; ampm: 'AM' | 'PM' } {
  const entries = Object.entries(mix) as [TimeFormat, number][]
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [format, weight] of entries) {
    r -= weight
    if (r <= 0) return { format, ampm: Math.random() < 0.5 ? 'AM' : 'PM' }
  }
  // Fallback
  return { format: entries[0]?.[0] ?? 'digital', ampm: Math.random() < 0.5 ? 'AM' : 'PM' }
}
