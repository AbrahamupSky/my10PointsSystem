export function getTier(lifetimePoints: number): {
  tier: string
  color: string
  bgColor: string
  minPoints: number
  nextTier: string | null
  nextTierPoints: number | null
} {
  if (lifetimePoints >= 10000)
    return {
      tier: 'Diamond',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-400',
      minPoints: 10000,
      nextTier: null,
      nextTierPoints: null,
    }
  if (lifetimePoints >= 6000)
    return {
      tier: 'Platinum',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-400',
      minPoints: 6000,
      nextTier: 'Diamond',
      nextTierPoints: 10000,
    }
  if (lifetimePoints >= 3000)
    return {
      tier: 'Gold',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-400',
      minPoints: 3000,
      nextTier: 'Platinum',
      nextTierPoints: 6000,
    }
  if (lifetimePoints >= 1000)
    return {
      tier: 'Silver',
      color: 'text-gray-500 dark:text-gray-300',
      bgColor: 'bg-gray-100 border-gray-300 dark:bg-gray-700/30 dark:border-gray-400',
      minPoints: 1000,
      nextTier: 'Gold',
      nextTierPoints: 3000,
    }
  return {
    tier: 'Bronze',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-400',
    minPoints: 0,
    nextTier: 'Silver',
    nextTierPoints: 1000,
  }
}
