import type { Difficulty } from '../../types'
import { formatTime, formatTimeAs } from '../Clock/clock-utils'
import type { TimeFormat } from '../Clock/clock-utils'

export interface ClockQuestion {
  hours: number
  minutes: number
}

/**
 * Generate a random time appropriate for the given difficulty.
 * If `notSameAs` is provided, re-rolls to avoid the exact same time back-to-back.
 */
export function generateTime(difficulty: Difficulty, notSameAs?: ClockQuestion): ClockQuestion {
  let attempts = 0
  while (attempts < 20) {
    const hours = Math.floor(Math.random() * 12) + 1 // 1-12
    let minutes: number

    switch (difficulty) {
      case 'hour':
        minutes = 0; break
      case 'half':
        minutes = Math.random() < 0.5 ? 0 : 30; break
      case 'quarter':
        minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)]; break
      case 'five_min':
        minutes = Math.floor(Math.random() * 12) * 5; break
      case 'one_min':
        minutes = Math.floor(Math.random() * 60); break
      case 'interval':
        minutes = Math.floor(Math.random() * 60); break
      default:
        minutes = 0
    }

    const result = { hours, minutes }
    if (!notSameAs || result.hours !== notSameAs.hours || result.minutes !== notSameAs.minutes) {
      return result
    }
    attempts++
  }
  // Fallback after many attempts (very unlikely — only for hour difficulty with 12 options)
  const hours = Math.floor(Math.random() * 12) + 1
  return { hours, minutes: 0 }
}

/**
 * Generate a hint string for a question, randomly choosing between
 * an hour hand hint and a minute hand hint (~50/50).
 */
export function generateHint(hours: number, minutes: number): string {
  const showHourHint = Math.random() < 0.5

  if (showHourHint) {
    // Hour hand hint
    if (minutes === 0) {
      return `The short hand points to ${hours}`
    }
    if (minutes <= 30) {
      return `The short hand is just past ${hours}`
    }
    const nextHour = hours === 12 ? 1 : hours + 1
    return `The short hand is almost at ${nextHour}`
  }

  // Minute hand hint
  if (minutes === 0) {
    return 'The long hand points straight up to 12'
  }
  const minuteMarker = Math.floor(minutes / 5)
  if (minutes % 5 === 0) {
    return `The long hand points to ${minuteMarker || 12}`
  }
  return `The long hand is near ${minuteMarker || 12}`
}

/**
 * Generate a random starting position for "Set the Clock" questions.
 * The position uses the same granularity as the difficulty (e.g. on-the-hour
 * for hour questions, on a quarter for quarter questions) but is guaranteed
 * to differ from the correct answer.
 */
export function generateStartTime(difficulty: Difficulty, correct: ClockQuestion): ClockQuestion {
  let attempts = 0
  while (attempts < 20) {
    const hours = Math.floor(Math.random() * 12) + 1
    let minutes: number

    switch (difficulty) {
      case 'hour':
        minutes = 0; break
      case 'half':
        minutes = Math.random() < 0.5 ? 0 : 30; break
      case 'quarter':
        minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)]; break
      case 'five_min':
        minutes = Math.floor(Math.random() * 12) * 5; break
      case 'one_min':
        minutes = Math.floor(Math.random() * 60); break
      case 'interval':
        minutes = Math.floor(Math.random() * 60); break
      default:
        minutes = 0
    }

    if (hours !== correct.hours || minutes !== correct.minutes) {
      return { hours, minutes }
    }
    attempts++
  }
  // Fallback: offset the hour by 1
  const fallbackHours = correct.hours === 12 ? 1 : correct.hours + 1
  return { hours: fallbackHours, minutes: correct.minutes }
}

/**
 * Generate multiple choice options including the correct answer.
 * When format/ampm are provided, all choices use that format for consistency.
 */
export function generateChoices(
  correct: ClockQuestion,
  difficulty: Difficulty,
  count: number = 4,
  format?: TimeFormat,
  ampm?: 'AM' | 'PM',
): string[] {
  const fmt = (h: number, m: number) =>
    format ? formatTimeAs(h, m, format, ampm) : formatTime(h, m)

  const correctStr = fmt(correct.hours, correct.minutes)
  const choices = new Set<string>([correctStr])

  while (choices.size < count) {
    const fake = generateDistractor(correct, difficulty)
    const fakeStr = fmt(fake.hours, fake.minutes)
    if (fakeStr !== correctStr) {
      choices.add(fakeStr)
    }
  }

  // Shuffle
  return Array.from(choices).sort(() => Math.random() - 0.5)
}

/**
 * Generate a plausible wrong answer.
 */
function generateDistractor(correct: ClockQuestion, difficulty: Difficulty): ClockQuestion {
  const strategies = [
    // Wrong hour
    () => ({
      hours: wrapHour(correct.hours + (Math.random() < 0.5 ? 1 : -1)),
      minutes: correct.minutes,
    }),
    // Swapped hands (common mistake)
    () => ({
      hours: Math.min(12, Math.max(1, Math.round(correct.minutes / 5) || 12)),
      minutes: correct.hours * 5 % 60,
    }),
    // Nearby minutes
    () => ({
      hours: correct.hours,
      minutes: wrapMinute(correct.minutes + nearbyOffset(difficulty)),
    }),
  ]

  return strategies[Math.floor(Math.random() * strategies.length)]()
}

function wrapHour(h: number): number {
  if (h > 12) return h - 12
  if (h < 1) return h + 12
  return h
}

function wrapMinute(m: number): number {
  return ((m % 60) + 60) % 60
}

function nearbyOffset(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'hour': return (Math.random() < 0.5 ? 1 : -1) * 30
    case 'half': return (Math.random() < 0.5 ? 1 : -1) * 15
    case 'quarter': return (Math.random() < 0.5 ? 1 : -1) * 15
    case 'five_min': return (Math.random() < 0.5 ? 1 : -1) * 5
    case 'one_min': return (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1)
    default: return 5
  }
}
