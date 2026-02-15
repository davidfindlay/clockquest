/**
 * Sound manager for ClockQuest.
 *
 * Preloads all MP3s as HTMLAudioElement instances so playback is instant.
 * Each sound has a small pool (3 elements) to allow rapid re-triggering
 * without cutting off the previous play (e.g. fast tick-tick-tick).
 */

import correctSrc from '../assets/correct.mp3'
import incorrectSrc from '../assets/incorrect.mp3'
import tadaSrc from '../assets/tada.mp3'
import tickSrc from '../assets/tick.mp3'
import tockSrc from '../assets/tock.mp3'

type SoundName = 'correct' | 'incorrect' | 'tada' | 'tick' | 'tock'

const SOURCES: Record<SoundName, string> = {
  correct: correctSrc,
  incorrect: incorrectSrc,
  tada: tadaSrc,
  tick: tickSrc,
  tock: tockSrc,
}

/** Pool size per sound — allows overlapping rapid plays */
const POOL_SIZE = 3

const pools: Record<string, HTMLAudioElement[]> = {}
const poolIndex: Record<string, number> = {}

/**
 * Preload all sounds. Call once on app startup.
 * Creates Audio elements and triggers load so they're cached by the browser.
 */
export function preloadSounds(): void {
  for (const [name, src] of Object.entries(SOURCES)) {
    const pool: HTMLAudioElement[] = []
    for (let i = 0; i < POOL_SIZE; i++) {
      const audio = new Audio(src)
      audio.preload = 'auto'
      audio.load()
      pool.push(audio)
    }
    pools[name] = pool
    poolIndex[name] = 0
  }
}

/**
 * Play a sound by name. Returns immediately; playback is fire-and-forget.
 * Uses a round-robin pool so rapid successive plays don't cut each other off.
 */
export function playSound(name: SoundName): void {
  const pool = pools[name]
  if (!pool) return

  const idx = poolIndex[name]
  const audio = pool[idx]
  poolIndex[name] = (idx + 1) % POOL_SIZE

  // Reset to start in case it's still playing from a previous trigger
  audio.currentTime = 0
  audio.play().catch(() => {
    // Autoplay may be blocked until first user interaction — that's fine
  })
}
