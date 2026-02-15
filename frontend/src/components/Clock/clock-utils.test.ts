import { describe, it, expect } from 'vitest'
import { timeToAngles, anglesToTime, snapAngle } from './clock-utils'

describe('snapAngle', () => {
  it('snaps to nearest multiple', () => {
    expect(snapAngle(7, 6)).toBe(6)
    expect(snapAngle(4, 6)).toBe(6)
    expect(snapAngle(2, 6)).toBe(0)
  })

  it('normalises 360 to 0', () => {
    // Angles that would round to 360 should return 0 instead
    expect(snapAngle(358, 6)).toBe(0)   // round(59.67)*6 = 360 → 0
    expect(snapAngle(356, 6)).toBe(354) // round(59.33)*6 = 354 (correctly stays 354)
    expect(snapAngle(359, 30)).toBe(0)  // round(11.97)*30 = 360 → 0
    expect(snapAngle(350, 30)).toBe(0)  // round(11.67)*30 = 360 → 0
  })

  it('does not affect angles far from 360', () => {
    expect(snapAngle(90, 6)).toBe(90)
    expect(snapAngle(180, 30)).toBe(180)
    expect(snapAngle(354, 6)).toBe(354)
  })
})

describe('timeToAngles', () => {
  it('12:00 is 0 degrees for both hands', () => {
    const { hourAngle, minuteAngle } = timeToAngles(12, 0)
    expect(hourAngle).toBe(0)
    expect(minuteAngle).toBe(0)
  })

  it('3:00 is 90 degrees for the hour hand', () => {
    const { hourAngle, minuteAngle } = timeToAngles(3, 0)
    expect(hourAngle).toBe(90)
    expect(minuteAngle).toBe(0)
  })

  it('6:30 positions hour hand between 6 and 7', () => {
    const { hourAngle } = timeToAngles(6, 30)
    // 6/12*360 + 30/60*30 = 180 + 15 = 195
    expect(hourAngle).toBe(195)
  })

  it('any:45 puts the minute hand at 270 degrees', () => {
    const { minuteAngle } = timeToAngles(1, 45)
    expect(minuteAngle).toBe(270)
  })
})

describe('anglesToTime', () => {
  it('converts 0 degrees to 12:00', () => {
    const { hours, minutes } = anglesToTime(0, 0)
    expect(hours).toBe(12)
    expect(minutes).toBe(0)
  })

  it('converts 90 degrees hour angle to 3', () => {
    const { hours } = anglesToTime(90, 0)
    expect(hours).toBe(3)
  })

  it('converts 270 degrees minute angle to 45 minutes', () => {
    const { minutes } = anglesToTime(0, 270)
    expect(minutes).toBe(45)
  })
})

describe('minute hand crossing 12 — hour adjustment', () => {
  /**
   * These tests verify the crossing-detection logic used by InteractiveClock.
   * When the minute hand crosses 12 o'clock (the 0°/360° boundary),
   * the hour should increment (clockwise) or decrement (counter-clockwise).
   *
   * The crossing detection works on snapped angles:
   *   delta = currentAngle - prevAngle
   *   if delta < -180 → crossed clockwise   → hour + 1
   *   if delta > 180  → crossed counter-cw  → hour - 1
   */

  function simulateCrossing(prevAngleDeg: number, currentAngleDeg: number, currentHour: number): number {
    const delta = currentAngleDeg - prevAngleDeg
    let newHours = currentHour
    if (delta < -180) {
      newHours = currentHour === 12 ? 1 : currentHour + 1
    } else if (delta > 180) {
      newHours = currentHour === 1 ? 12 : currentHour - 1
    }
    return newHours
  }

  it('clockwise past 12: minute 354° → 0° increments hour', () => {
    // With snapAngle normalisation, 358° snaps to 0° (not 360°)
    const snappedPrev = snapAngle(354, 6) // 354
    const snappedCurr = snapAngle(358, 6) // 0 (normalised from 360)
    expect(snappedCurr).toBe(0) // critical: must be 0, not 360
    const newHour = simulateCrossing(snappedPrev, snappedCurr, 3)
    expect(newHour).toBe(4) // hour increments from 3 to 4
  })

  it('clockwise past 12: minute 348° → 6° increments hour', () => {
    const newHour = simulateCrossing(348, 6, 5)
    expect(newHour).toBe(6)
  })

  it('counter-clockwise past 12: minute 6° → 354° decrements hour', () => {
    const newHour = simulateCrossing(6, 354, 5)
    expect(newHour).toBe(4)
  })

  it('no crossing: minute 90° → 96° keeps same hour', () => {
    const newHour = simulateCrossing(90, 96, 3)
    expect(newHour).toBe(3)
  })

  it('no crossing: minute 270° → 276° keeps same hour', () => {
    const newHour = simulateCrossing(270, 276, 7)
    expect(newHour).toBe(7)
  })

  it('wraps 12 → 1 when crossing clockwise at hour 12', () => {
    const newHour = simulateCrossing(354, 0, 12)
    expect(newHour).toBe(1)
  })

  it('wraps 1 → 12 when crossing counter-clockwise at hour 1', () => {
    const newHour = simulateCrossing(6, 354, 1)
    expect(newHour).toBe(12)
  })

  it('full scenario: drag from 9 (270°) through 11 (330°) to 12 (0°)', () => {
    // Simulating the user's exact scenario: minute at 45 (270°), drag to 55 (330°), then to 0 (0°)
    let hour = 3

    // Step 1: 270° → 330° (no crossing, still on same half)
    hour = simulateCrossing(270, 330, hour)
    expect(hour).toBe(3) // no change

    // Step 2: 330° → 0° (crossing! delta = 0 - 330 = -330 < -180)
    hour = simulateCrossing(330, 0, hour)
    expect(hour).toBe(4) // hour advances

    // Verify the resulting time makes sense
    const { hourAngle } = timeToAngles(hour, 0)
    expect(hourAngle).toBe(120) // 4 o'clock at 120°
  })

  it('without snapAngle fix, 358° would snap to 360 and break crossing detection', () => {
    // This test proves the bug existed before the fix:
    // If snapAngle returned 360 instead of 0, delta = 360 - 354 = 6 (not < -180)
    // so no crossing would be detected, and the hour would NOT increment.
    const brokenSnap = Math.round(358 / 6) * 6 // 360 (the old buggy result)
    expect(brokenSnap).toBe(360)
    const brokenHour = simulateCrossing(354, brokenSnap, 3)
    expect(brokenHour).toBe(3) // BUG: hour stays at 3 instead of advancing to 4

    // With the fix, snapAngle returns 0
    const fixedSnap = snapAngle(358, 6)
    expect(fixedSnap).toBe(0)
    const fixedHour = simulateCrossing(354, fixedSnap, 3)
    expect(fixedHour).toBe(4) // CORRECT: hour advances to 4
  })
})
