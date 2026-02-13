export interface TierInfo {
  index: number
  name: string
  color: string
  minPower: number
  maxPower: number
}

export const TIERS: TierInfo[] = [
  { index: 0, name: 'Wood', color: '#8B6914', minPower: 0, maxPower: 99 },
  { index: 1, name: 'Stone', color: '#808080', minPower: 100, maxPower: 199 },
  { index: 2, name: 'Coal', color: '#555555', minPower: 200, maxPower: 299 },
  { index: 3, name: 'Iron', color: '#C0C0C0', minPower: 300, maxPower: 399 },
  { index: 4, name: 'Gold', color: '#FFD700', minPower: 400, maxPower: 499 },
  { index: 5, name: 'Redstone', color: '#FF0000', minPower: 500, maxPower: 599 },
  { index: 6, name: 'Lapis', color: '#1E40AF', minPower: 600, maxPower: 699 },
  { index: 7, name: 'Diamond', color: '#00CED1', minPower: 700, maxPower: 799 },
  { index: 8, name: 'Netherite', color: '#4A0E4E', minPower: 800, maxPower: 899 },
  { index: 9, name: 'Beacon', color: '#FFEA00', minPower: 900, maxPower: 999 },
  { index: 10, name: 'Clock Master', color: '#FF69B4', minPower: 1000, maxPower: 1000 },
]

export function getTierByIndex(index: number): TierInfo {
  return TIERS[Math.min(Math.max(0, index), 10)]
}

export function getTierByPower(power: number): TierInfo {
  const idx = Math.min(Math.floor(power / 100), 10)
  return TIERS[idx]
}
