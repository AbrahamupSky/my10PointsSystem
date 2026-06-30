export function getTier(lifetimePoints: number): {
  tier: string
  color: string
  bgColor: string
  minPoints: number
  nextTier: string | null
  nextTierPoints: number | null
} {
  if (lifetimePoints >= 301)
    return {
      tier: 'Tier 5',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-400',
      minPoints: 301,
      nextTier: null,
      nextTierPoints: null,
    }
  if (lifetimePoints >= 101)
    return {
      tier: 'Tier 4',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-400',
      minPoints: 101,
      nextTier: 'Tier 5',
      nextTierPoints: 301,
    }
  if (lifetimePoints >= 41)
    return {
      tier: 'Tier 3',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-400',
      minPoints: 41,
      nextTier: 'Tier 4',
      nextTierPoints: 101,
    }
  if (lifetimePoints >= 11)
    return {
      tier: 'Tier 2',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-400',
      minPoints: 11,
      nextTier: 'Tier 3',
      nextTierPoints: 41,
    }
  return {
    tier: 'Tier 1',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-400',
    minPoints: 5,
    nextTier: 'Tier 2',
    nextTierPoints: 11,
  }
}
