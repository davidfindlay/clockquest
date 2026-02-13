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
}

export const TIERS: TierInfo[] = [
  { index: 0, name: 'Wood', color: '#8B6914', icon: woodIcon, minPower: 0, maxPower: 99 },
  { index: 1, name: 'Stone', color: '#808080', icon: stoneIcon, minPower: 100, maxPower: 199 },
  { index: 2, name: 'Coal', color: '#555555', icon: coalIcon, minPower: 200, maxPower: 299 },
  { index: 3, name: 'Iron', color: '#C0C0C0', icon: ironIcon, minPower: 300, maxPower: 399 },
  { index: 4, name: 'Gold', color: '#FFD700', icon: goldIcon, minPower: 400, maxPower: 499 },
  { index: 5, name: 'Redstone', color: '#FF0000', icon: redstoneIcon, minPower: 500, maxPower: 599 },
  { index: 6, name: 'Lapis', color: '#1E40AF', icon: lapisIcon, minPower: 600, maxPower: 699 },
  { index: 7, name: 'Diamond', color: '#00CED1', icon: diamondIcon, minPower: 700, maxPower: 799 },
  { index: 8, name: 'Netherite', color: '#4A0E4E', icon: netheriteIcon, minPower: 800, maxPower: 899 },
  { index: 9, name: 'Beacon', color: '#FFEA00', icon: beaconIcon, minPower: 900, maxPower: 999 },
  { index: 10, name: 'Clock Master', color: '#FF69B4', icon: clockMasterIcon, minPower: 1000, maxPower: 1000 },
]

export function getTierByIndex(index: number): TierInfo {
  return TIERS[Math.min(Math.max(0, index), 10)]
}

export function getTierByPower(power: number): TierInfo {
  const idx = Math.min(Math.floor(power / 100), 10)
  return TIERS[idx]
}
