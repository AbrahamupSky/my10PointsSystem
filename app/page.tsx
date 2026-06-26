'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TierBadge from '@/components/TierBadge'
import PointsModal from '@/components/PointsModal'
import { useSession } from 'next-auth/react'

interface Transaction {
  id: number
  employee_id: number
  type: string
  points: number
  notes: string | null
  created_at: string
  employee_name: string
  category_name: string | null
  gift_name: string | null
  bounty_title: string | null
  created_by_name: string | null
}

interface Employee {
  id: number
  name: string
  current_points: number
  lifetime_points: number
  department: string | null
}

interface TierDist {
  tier: string
  count: number
  color: string
}

interface DashboardData {
  totalEmployees: number
  totalPointsAwarded: number
  activeBounties: number
  recentTransactions: Transaction[]
  topEmployees: Employee[]
  tierDistribution: TierDist[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const user = session?.user as { role?: string } | undefined

  async function fetchData() {
    const res = await fetch('/api/dashboard')
    if (res.ok) {
      setData(await res.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getTransactionLabel(tx: Transaction) {
    if (tx.type === 'award') return tx.category_name || 'Award'
    if (tx.type === 'deduct') return tx.category_name || 'Deduction'
    if (tx.type === 'gift_exchange') return tx.gift_name ? `Gift: ${tx.gift_name}` : 'Gift Exchange'
    if (tx.type === 'bounty') return tx.bounty_title ? `Bounty: ${tx.bounty_title}` : 'Bounty'
    return tx.type
  }

  const canManage = user?.role === 'admin' || user?.role === 'manager'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cfa-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cfa-ink">Dashboard</h1>
          <p className="text-cfa-ink-soft text-sm mt-0.5">Overview of your points system</p>
        </div>
        {canManage && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Award Points
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-cfa-ink-soft text-xs font-medium uppercase tracking-wide">Total Employees</p>
              <p className="text-2xl font-bold text-cfa-ink">{data?.totalEmployees ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-cfa-card rounded-xl border border-cfa-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cfa-red/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-cfa-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-cfa-ink-soft text-xs font-medium uppercase tracking-wide">Points Awarded</p>
              <p className="text-2xl font-bold text-cfa-ink">{(data?.totalPointsAwarded ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-cfa-card rounded-xl border border-cfa-border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="text-cfa-ink-soft text-xs font-medium uppercase tracking-wide">Active Bounties</p>
              <p className="text-2xl font-bold text-cfa-ink">{data?.activeBounties ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-5">
          <h2 className="text-base font-semibold text-cfa-ink mb-4">Tier Distribution</h2>
          <div className="space-y-3">
            {data?.tierDistribution.map((tier) => (
              <div key={tier.tier} className="flex items-center gap-3">
                <span className={`text-sm font-medium w-16 ${tier.color}`}>{tier.tier}</span>
                <div className="flex-1 bg-cfa-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      tier.color.includes('orange') ? 'bg-orange-500' :
                      tier.color.includes('gray') ? 'bg-gray-400' :
                      tier.color.includes('yellow') ? 'bg-yellow-500' :
                      tier.color.includes('purple') ? 'bg-purple-500' :
                      'bg-blue-500'
                    }`}
                    style={{
                      width: data.totalEmployees > 0
                        ? `${(tier.count / data.totalEmployees) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <span className="text-cfa-ink-soft text-sm w-6 text-right">{tier.count}</span>
              </div>
            ))}
            {(!data?.tierDistribution || data.tierDistribution.every((t) => t.count === 0)) && (
              <p className="text-cfa-ink-dim text-sm text-center py-4">No employees yet</p>
            )}
          </div>
        </div>

        {/* Top Employees */}
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-cfa-ink">Top Employees</h2>
            <Link href="/employees" className="text-cfa-red text-xs hover:text-cfa-red-dark transition-colors">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {data?.topEmployees.length === 0 && (
              <p className="text-cfa-ink-dim text-sm text-center py-4">No employees yet</p>
            )}
            {data?.topEmployees.map((emp, i) => (
              <Link
                key={emp.id}
                href={`/employees/${emp.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-cfa-muted transition-colors group"
              >
                <span className="text-cfa-ink-dim font-bold text-sm w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-cfa-ink text-sm font-medium group-hover:text-cfa-red transition-colors truncate">
                    {emp.name}
                  </p>
                  {emp.department && (
                    <p className="text-cfa-ink-dim text-xs truncate">{emp.department}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <TierBadge lifetimePoints={emp.lifetime_points} size="sm" />
                  <p className="text-cfa-ink-soft text-xs mt-0.5">{emp.lifetime_points.toLocaleString()} pts</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-cfa-card rounded-xl border border-cfa-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-cfa-ink">Recent Transactions</h2>
          <Link href="/transactions" className="text-cfa-red text-xs hover:text-cfa-red-dark transition-colors">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {data?.recentTransactions.length === 0 && (
            <p className="text-cfa-ink-dim text-sm text-center py-6">No transactions yet</p>
          )}
          {data?.recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-cfa-muted/50 hover:bg-cfa-muted transition-colors"
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  tx.points > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-cfa-ink text-sm font-medium">{tx.employee_name}</span>
                  <span className="text-cfa-ink-dim text-xs">·</span>
                  <span className="text-cfa-ink-soft text-xs">{getTransactionLabel(tx)}</span>
                </div>
                {tx.notes && <p className="text-cfa-ink-dim text-xs truncate mt-0.5">{tx.notes}</p>}
              </div>
              <div className="flex-shrink-0 text-right">
                <span
                  className={`text-sm font-semibold ${tx.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </span>
                <p className="text-cfa-ink-dim text-xs mt-0.5">{formatDate(tx.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PointsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}
