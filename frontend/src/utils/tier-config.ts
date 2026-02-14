import woodIcon from '../assets/wood.svg'
import stoneIcon from '../assets/stone.svg'
import coalIcon from '../assets/coal.svg'
import ironIcon from '../assets/iron.svg'
import goldIcon from '../assets/gold.svg'
import redstoneIcon from '../assets/redstone.svg'
import lapisIcon from '../assets/lapis.svg'
import diamondIcon from '../assets/diamond.svg'
import netheriteIcon from '../assets/netherite.svg'
import beaconIcon from '../assets/beacon.svg'
import clockMasterIcon from '../assets/clock_master.svg'

export interface TierInfo {
  index: number
  name: string
  color: string
  icon: string
  minPower: number
  maxPower: number
  skill: string | null
  questRunMix: Record<string, number>
}

// SVG icons are frontend assets — map them by tier index
const TIER_ICONS: Record<number, string> = {
  0: woodIcon,
  1: stoneIcon,
  2: coalIcon,
  3: ironIcon,
  4: goldIcon,
  5: redstoneIcon,
  6: lapisIcon,
  7: diamondIcon,
  8: netheriteIcon,
  9: beaconIcon,
  10: clockMasterIcon,
}

// Fallback tier data used before API response arrives (keeps app functional during load)
const FALLBACK_TIERS: TierInfo[] = [
  { index: 0, name: 'Wood', color: '#8B6914', icon: woodIcon, minPower: 0, maxPower: 99, skill: null, questRunMix: { hour: 1.0 } },
  { index: 1, name: 'Stone', color: '#808080', icon: stoneIcon, minPower: 100, maxPower: 199, skill: 'Reads hours on the clock', questRunMix: { hour: 0.3, half: 0.7 } },
  { index: 2, name: 'Coal', color: '#333333', icon: coalIcon, minPower: 200, maxPower: 299, skill: 'Reads half past / half to', questRunMix: { half: 0.2, quarter: 0.8 } },
  { index: 3, name: 'Iron', color: '#C0C0C0', icon: ironIcon, minPower: 300, maxPower: 399, skill: 'Reads quarter past / quarter to', questRunMix: { quarter: 0.5, five_min: 0.5 } },
  { index: 4, name: 'Gold', color: '#FFD700', icon: goldIcon, minPower: 400, maxPower: 499, skill: 'Reads 5-minute intervals', questRunMix: { quarter: 0.2, five_min: 0.8 } },
  { index: 5, name: 'Redstone', color: '#FF0000', icon: redstoneIcon, minPower: 500, maxPower: 599, skill: 'Reads 5-minute intervals quickly', questRunMix: { five_min: 0.5, one_min: 0.5 } },
  { index: 6, name: 'Lapis', color: '#1E40AF', icon: lapisIcon, minPower: 600, maxPower: 699, skill: 'Reads any minute precisely', questRunMix: { five_min: 0.2, one_min: 0.8 } },
  { index: 7, name: 'Diamond', color: '#00CED1', icon: diamondIcon, minPower: 700, maxPower: 799, skill: 'Masters mixed clock reading', questRunMix: { five_min: 0.1, one_min: 0.9 } },
  { index: 8, name: 'Netherite', color: '#4A0E4E', icon: netheriteIcon, minPower: 800, maxPower: 899, skill: 'Calculates time intervals', questRunMix: { one_min: 0.7, interval: 0.3 } },
  { index: 9, name: 'Beacon', color: '#FFEA00', icon: beaconIcon, minPower: 900, maxPower: 999, skill: 'Advanced time reasoning', questRunMix: { one_min: 0.5, interval: 0.5 } },
  { index: 10, name: 'Clock Master', color: '#FF69B4', icon: clockMasterIcon, minPower: 1000, maxPower: 1000, skill: 'Clock Master — full mastery!', questRunMix: { one_min: 0.3, interval: 0.7 } },
]

// Mutable tier list — starts as fallback, replaced when API responds
let tiers: TierInfo[] = [...FALLBACK_TIERS]
let loaded = false

interface ApiTier {
  index: number
  name: string
  color: string
  min_power: number
  max_power: number
  skill: string | null
  quest_run_mix: Record<string, number>
}

function applyApiTiers(apiTiers: ApiTier[]) {
  tiers = apiTiers.map(t => ({
    index: t.index,
    name: t.name,
    color: t.color,
    icon: TIER_ICONS[t.index] ?? woodIcon,
    minPower: t.min_power,
    maxPower: t.max_power,
    skill: t.skill,
    questRunMix: t.quest_run_mix,
  }))
  loaded = true
}

/** Fetch tier data from backend. Call once at app startup. */
export async function loadTiers(): Promise<void> {
  if (loaded) return
  try {
    const res = await fetch('/api/tiers')
    if (res.ok) {
      const data: ApiTier[] = await res.json()
      applyApiTiers(data)
    }
  } catch {
    // Fallback data is already in place — app works fine offline
  }
}

/** All tiers. Always returns data (fallback or API). */
export function getTiers(): TierInfo[] {
  return tiers
}

export function getTierByIndex(index: number): TierInfo {
  return tiers[Math.min(Math.max(0, index), tiers.length - 1)]
}

export function getTierByPower(power: number): TierInfo {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (power >= tiers[i].minPower) return tiers[i]
  }
  return tiers[0]
}
