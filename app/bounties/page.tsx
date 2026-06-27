'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { sileo } from 'sileo'

interface Bounty {
  id: number
  title: string
  description: string | null
  points_reward: number
  active: number
  deadline: string | null
  created_at: string
}

export default function BountiesPage() {
  const { data: session } = useSession()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_reward: '',
    deadline: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const user = session?.user as { role?: string } | undefined
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const isAdmin = user?.role === 'admin'

  async function fetchBounties() {
    const res = await fetch('/api/bounties')
    if (res.ok) setBounties(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetchBounties()
  }, [])

  function resetForm() {
    setFormData({ title: '', description: '', points_reward: '', deadline: '' })
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  function startEdit(bounty: Bounty) {
    setFormData({
      title: bounty.title,
      description: bounty.description || '',
      points_reward: String(bounty.points_reward),
      deadline: bounty.deadline || '',
    })
    setEditingId(bounty.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const body = {
      title: formData.title,
      description: formData.description,
      points_reward: Number(formData.points_reward),
      deadline: formData.deadline || null,
    }

    try {
      const url = editingId ? `/api/bounties/${editingId}` : '/api/bounties'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save bounty')
        return
      }

      await fetchBounties()
      resetForm()
    } catch {
      setError('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(bounty: Bounty) {
    await fetch(`/api/bounties/${bounty.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bounty, active: bounty.active === 1 ? 0 : 1 }),
    })
    fetchBounties()
  }

  function handleDelete(id: number, title: string) {
    sileo.action({
      title: `Delete "${title}"?`,
      description: 'This bounty will be permanently removed.',
      duration: null,
      button: {
        title: 'Delete',
        onClick: async () => {
          const res = await fetch(`/api/bounties/${id}`, { method: 'DELETE' })
          if (res.ok) {
            fetchBounties()
            sileo.success({ title: 'Deleted', description: `"${title}" has been removed.` })
          } else {
            sileo.error({ title: 'Error', description: 'Failed to delete bounty.' })
          }
        },
      },
    })
  }

  function formatDeadline(deadline: string | null) {
    if (!deadline) return null
    const date = new Date(deadline)
    const now = new Date()
    const isPast = date < now
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return { formatted, isPast }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cfa-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeBounties = bounties.filter((b) => b.active === 1)
  const inactiveBounties = bounties.filter((b) => b.active === 0)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cfa-ink">Bounties</h1>
          <p className="text-cfa-ink-soft text-sm mt-0.5">Special tasks with point rewards</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Bounty
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-5">
          <h2 className="text-base font-semibold text-cfa-ink mb-4">
            {editingId ? 'Edit Bounty' : 'New Bounty'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Bounty title"
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Points Reward</label>
                <input
                  type="number"
                  value={formData.points_reward}
                  onChange={(e) => setFormData({ ...formData, points_reward: e.target.value })}
                  required
                  min="1"
                  placeholder="e.g. 100"
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">
                  Deadline <span className="text-cfa-ink-dim">(optional)</span>
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">
                  Description <span className="text-cfa-ink-dim">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 bg-cfa-muted hover:bg-cfa-border text-cfa-ink rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Bounties */}
      <div>
        <h2 className="text-sm font-medium text-cfa-ink-soft uppercase tracking-wider mb-3">
          Active Bounties ({activeBounties.length})
        </h2>
        {activeBounties.length === 0 ? (
          <div className="bg-cfa-card rounded-xl border border-cfa-border p-6 text-center">
            <p className="text-cfa-ink-dim text-sm">No active bounties</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBounties.map((bounty) => {
              const deadlineInfo = formatDeadline(bounty.deadline)
              return (
                <div key={bounty.id} className="bg-cfa-card rounded-xl border border-cfa-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-cfa-ink font-semibold">{bounty.title}</h3>
                        <span className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                        {deadlineInfo && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            deadlineInfo.isPast
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              : 'bg-cfa-muted text-cfa-ink-soft'
                          }`}>
                            {deadlineInfo.isPast ? 'Expired: ' : 'Deadline: '}{deadlineInfo.formatted}
                          </span>
                        )}
                      </div>
                      {bounty.description && (
                        <p className="text-cfa-ink-soft text-sm mt-1">{bounty.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">+{bounty.points_reward}</span>
                      <p className="text-cfa-ink-dim text-xs">points</p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-cfa-border/50">
                      <button
                        onClick={() => startEdit(bounty)}
                        className="px-3 py-1 bg-cfa-muted hover:bg-cfa-border text-cfa-ink-soft rounded-lg text-xs transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(bounty)}
                        className="px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg text-xs transition-colors"
                      >
                        Deactivate
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(bounty.id, bounty.title)}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Inactive Bounties */}
      {inactiveBounties.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-cfa-ink-soft uppercase tracking-wider mb-3">
            Inactive Bounties ({inactiveBounties.length})
          </h2>
          <div className="space-y-3">
            {inactiveBounties.map((bounty) => {
              const deadlineInfo = formatDeadline(bounty.deadline)
              return (
                <div key={bounty.id} className="bg-cfa-card rounded-xl border border-cfa-border/50 p-4 opacity-60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-cfa-ink font-semibold">{bounty.title}</h3>
                        <span className="text-xs bg-cfa-muted text-cfa-ink-soft px-2 py-0.5 rounded-full">Inactive</span>
                        {deadlineInfo && (
                          <span className="text-xs bg-cfa-muted text-cfa-ink-dim px-2 py-0.5 rounded-full">
                            {deadlineInfo.formatted}
                          </span>
                        )}
                      </div>
                      {bounty.description && (
                        <p className="text-cfa-ink-soft text-sm mt-1">{bounty.description}</p>
                      )}
                    </div>
                    <span className="text-cfa-ink-soft font-bold flex-shrink-0">+{bounty.points_reward} pts</span>
                  </div>
                  {canManage && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-cfa-border/50">
                      <button
                        onClick={() => startEdit(bounty)}
                        className="px-3 py-1 bg-cfa-muted hover:bg-cfa-border text-cfa-ink-soft rounded-lg text-xs transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(bounty)}
                        className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-xs transition-colors"
                      >
                        Activate
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(bounty.id, bounty.title)}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {bounties.length === 0 && !showForm && (
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-12 text-center">
          <svg className="w-12 h-12 text-cfa-ink-dim mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <p className="text-cfa-ink-soft font-medium">No bounties yet</p>
          {canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add First Bounty
            </button>
          )}
        </div>
      )}
    </div>
  )
}
