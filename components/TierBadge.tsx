'use client'

import { getTier } from '@/lib/tiers'

interface TierBadgeProps {
  lifetimePoints: number
  showPoints?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function TierBadge({ lifetimePoints, showPoints = false, size = 'md' }: TierBadgeProps) {
  const { tier, color, bgColor } = getTier(lifetimePoints)

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const tierEmoji = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Platinum: '💎',
    Diamond: '💠',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${sizeClasses[size]} ${color} ${bgColor}`}
    >
      <span>{tierEmoji[tier as keyof typeof tierEmoji]}</span>
      <span>{tier}</span>
      {showPoints && <span className="opacity-70">({lifetimePoints.toLocaleString()} pts)</span>}
    </span>
  )
}
