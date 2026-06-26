export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  role: 'admin' | 'manager' | 'viewer'
  created_at: string
}

export interface Employee {
  id: number
  name: string
  email: string | null
  department: string | null
  current_points: number
  lifetime_points: number
  created_at: string
}

export interface Category {
  id: number
  name: string
  description: string | null
  points_value: number
  type: 'award' | 'deduct'
  active: number
  created_at: string
}

export interface Gift {
  id: number
  name: string
  description: string | null
  points_cost: number
  available: number
  created_at: string
}

export interface Bounty {
  id: number
  title: string
  description: string | null
  points_reward: number
  active: number
  deadline: string | null
  created_at: string
}

export interface Transaction {
  id: number
  employee_id: number
  type: 'award' | 'deduct' | 'gift_exchange' | 'bounty'
  category_id: number | null
  gift_id: number | null
  bounty_id: number | null
  points: number
  notes: string | null
  created_at: string
  created_by: number | null
  edited_at: string | null
  edited_by: number | null
  edit_notes: string | null
  // Joined fields
  employee_name?: string
  category_name?: string
  gift_name?: string
  bounty_title?: string
  created_by_name?: string
}

export interface TierInfo {
  tier: string
  color: string
  bgColor: string
  minPoints: number
  nextTier: string | null
  nextTierPoints: number | null
}

export interface DashboardStats {
  totalEmployees: number
  totalPointsAwarded: number
  activeBounties: number
  recentTransactions: Transaction[]
  tierDistribution: { tier: string; count: number; color: string }[]
  topEmployees: Employee[]
}
