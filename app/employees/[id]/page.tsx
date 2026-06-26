'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import TierBadge from '@/components/TierBadge'
import PointsModal from '@/components/PointsModal'
import { useSession } from 'next-auth/react'
import { getTier } from '@/lib/tiers'

interface Employee {
  id: number
  name: string
  email: string | null
  department: string | null
  current_points: number
  lifetime_points: number
  created_at: string
}

interface Transaction {
  id: number
  type: string
  points: number
  notes: string | null
  created_at: string
  category_name: string | null
  gift_name: string | null
  bounty_title: string | null
  created_by_name: string | null
  edited_at: string | null
  edit_notes: string | null
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [saving, setSaving] = useState(false)

  const user = session?.user as { role?: string } | undefined
  const canManage = user?.role === 'admin' || user?.role === 'manager'

  async function fetchData() {
    const res = await fetch(`/api/employees/${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setEmployee(data.employee)
      setTransactions(data.transactions)
    } else if (res.status === 404) {
      router.push('/employees')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [params.id])

  function startEdit() {
    if (!employee) return
    setEditName(employee.name)
    setEditEmail(employee.email || '')
    setEditDepartment(employee.department || '')
    setEditMode(true)
  }

  async function handleSave() {
    if (!employee) return
    setSaving(true)
    const res = await fetch(`/api/employees/${employee.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, email: editEmail, department: editDepartment }),
    })
    if (res.ok) {
      const updated = await res.json()
      setEmployee(updated)
      setEditMode(false)
    }
    setSaving(false)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cfa-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!employee) return null

  const tierInfo = getTier(employee.lifetime_points)
  const progressToNext = tierInfo.nextTierPoints
    ? ((employee.lifetime_points - tierInfo.minPoints) / (tierInfo.nextTierPoints - tierInfo.minPoints)) * 100
    : 100

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/employees"
        className="inline-flex items-center gap-2 text-cfa-ink-soft hover:text-cfa-ink transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Employees
      </Link>

      {/* Employee Profile Card */}
      <div className="bg-cfa-card rounded-xl border border-cfa-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-cfa-red flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {employee.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {editMode ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-cfa-muted border border-cfa-border rounded-lg px-3 py-1.5 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red w-48"
                  placeholder="Name"
                />
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="bg-cfa-muted border border-cfa-border rounded-lg px-3 py-1.5 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red w-48"
                  placeholder="Email"
                />
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="bg-cfa-muted border border-cfa-border rounded-lg px-3 py-1.5 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red w-48"
                  placeholder="Department"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold text-cfa-ink">{employee.name}</h1>
                {employee.department && <p className="text-cfa-ink-soft text-sm">{employee.department}</p>}
                {employee.email && <p className="text-cfa-ink-dim text-sm">{employee.email}</p>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <TierBadge lifetimePoints={employee.lifetime_points} size="md" />
            {canManage && (
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-3 py-1.5 bg-cfa-muted hover:bg-cfa-border text-cfa-ink rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-1.5 bg-cfa-red hover:bg-cfa-red-dark text-white rounded-lg text-sm transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEdit}
                    className="px-3 py-1.5 bg-cfa-muted hover:bg-cfa-border text-cfa-ink-soft rounded-lg text-sm transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Points Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-cfa-muted rounded-lg p-3">
            <p className="text-cfa-ink-soft text-xs font-medium">Current Points</p>
            <p className="text-cfa-red font-bold text-xl">{employee.current_points.toLocaleString()}</p>
          </div>
          <div className="bg-cfa-muted rounded-lg p-3">
            <p className="text-cfa-ink-soft text-xs font-medium">Lifetime Points</p>
            <p className="text-cfa-ink font-bold text-xl">{employee.lifetime_points.toLocaleString()}</p>
          </div>
          <div className="bg-cfa-muted rounded-lg p-3">
            <p className="text-cfa-ink-soft text-xs font-medium">Tier</p>
            <p className={`font-bold text-xl ${tierInfo.color}`}>{tierInfo.tier}</p>
          </div>
          <div className="bg-cfa-muted rounded-lg p-3">
            <p className="text-cfa-ink-soft text-xs font-medium">Transactions</p>
            <p className="text-cfa-ink font-bold text-xl">{transactions.length}</p>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${tierInfo.color}`}>{tierInfo.tier}</span>
            {tierInfo.nextTier ? (
              <span className="text-cfa-ink-soft text-sm">
                {(tierInfo.nextTierPoints! - employee.lifetime_points).toLocaleString()} pts to {tierInfo.nextTier}
              </span>
            ) : (
              <span className="text-blue-500 dark:text-blue-400 text-sm">Max Tier Achieved!</span>
            )}
          </div>
          <div className="w-full bg-cfa-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                tierInfo.tier === 'Bronze' ? 'bg-orange-500' :
                tierInfo.tier === 'Silver' ? 'bg-gray-400' :
                tierInfo.tier === 'Gold' ? 'bg-yellow-500' :
                tierInfo.tier === 'Platinum' ? 'bg-purple-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
          {tierInfo.nextTierPoints && (
            <div className="flex justify-between mt-1">
              <span className="text-cfa-ink-dim text-xs">{tierInfo.minPoints.toLocaleString()}</span>
              <span className="text-cfa-ink-dim text-xs">{tierInfo.nextTierPoints.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {canManage && (
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Award Points
            </button>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-cfa-card rounded-xl border border-cfa-border p-5">
        <h2 className="text-base font-semibold text-cfa-ink mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-cfa-ink-dim text-sm text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-start gap-3 p-3 bg-cfa-muted/50 rounded-lg">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    tx.points > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-cfa-ink text-sm font-medium">{getTransactionLabel(tx)}</span>
                    <span
                      className={`text-sm font-bold flex-shrink-0 ${
                        tx.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </span>
                  </div>
                  {tx.notes && <p className="text-cfa-ink-soft text-xs mt-0.5">{tx.notes}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-cfa-ink-dim text-xs">{formatDate(tx.created_at)}</span>
                    {tx.created_by_name && (
                      <span className="text-cfa-ink-dim text-xs">by {tx.created_by_name}</span>
                    )}
                    {tx.edited_at && (
                      <span className="text-yellow-600 dark:text-yellow-500 text-xs">(edited)</span>
                    )}
                  </div>
                  {tx.edited_at && tx.edit_notes && (
                    <p className="text-yellow-600/70 dark:text-yellow-500/70 text-xs mt-0.5">Edit note: {tx.edit_notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PointsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        defaultEmployeeId={employee.id}
      />
    </div>
  )
}
