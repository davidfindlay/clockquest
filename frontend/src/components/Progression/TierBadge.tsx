import { getTierByIndex } from '../../utils/tier-config'

interface TierBadgeProps {
  tier: number
  size?: 'sm' | 'md' | 'lg'
}

const iconSizes = { sm: 32, md: 40, lg: 56 }

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const info = getTierByIndex(tier)
  const sizes = { sm: 'text-base px-3 py-1.5', md: 'text-lg px-4 py-2', lg: 'text-2xl px-5 py-3' }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-bold ${sizes[size]}`}
      style={{ backgroundColor: info.color + '30', color: info.color, border: `2px solid ${info.color}` }}
    >
      <img src={info.icon} alt={info.name} width={iconSizes[size]} height={iconSizes[size]} className="flex-shrink-0" />
      {info.name}
    </span>
  )
}
