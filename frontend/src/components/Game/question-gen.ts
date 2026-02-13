import type { Difficulty } from '../../types'
import { formatTime } from '../Clock/clock-utils'

export interface ClockQuestion {
  hours: number
  minutes: number
}

/**
 * Generate a random time appropriate for the given difficulty.
 */
export function generateTime(difficulty: Difficulty): ClockQuestion {
  const hours = Math.floor(Math.random() * 12) + 1 // 1-12

  switch (difficulty) {
    case 'hour':
      return { hours, minutes: 0 }
    case 'half':
      return { hours, minutes: Math.random() < 0.5 ? 0 : 30 }
    case 'quarter':
      return { hours, minutes: [0, 15, 30, 45][Math.floor(Math.random() * 4)] }
    case 'five_min':
      return { hours, minutes: Math.floor(Math.random() * 12) * 5 }
    case 'one_min':
      return { hours, minutes: Math.floor(Math.random() * 60) }
    case 'interval':
      return { hours, minutes: Math.floor(Math.random() * 60) }
    default:
      return { hours, minutes: 0 }
  }
}

/**
 * Generate multiple choice options including the correct answer.
 */
export function generateChoices(correct: ClockQuestion, difficulty: Difficulty, count: number = 4): string[] {
  const correctStr = formatTime(correct.hours, correct.minutes)
  const choices = new Set<string>([correctStr])

  while (choices.size < count) {
    const fake = generateDistractor(correct, difficulty)
    const fakeStr = formatTime(fake.hours, fake.minutes)
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
