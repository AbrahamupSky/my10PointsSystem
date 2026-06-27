'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { sileo } from 'sileo'

interface Gift {
  id: number
  name: string
  description: string | null
  points_cost: number
  available: number
  created_at: string
}

export default function GiftsPage() {
  const { data: session } = useSession()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_cost: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const user = session?.user as { role?: string } | undefined
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const isAdmin = user?.role === 'admin'

  async function fetchGifts() {
    const res = await fetch('/api/gifts')
    if (res.ok) setGifts(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetchGifts()
  }, [])

  function resetForm() {
    setFormData({ name: '', description: '', points_cost: '' })
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  function startEdit(gift: Gift) {
    setFormData({
      name: gift.name,
      description: gift.description || '',
      points_cost: String(gift.points_cost),
    })
    setEditingId(gift.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const body = {
      name: formData.name,
      description: formData.description,
      points_cost: Number(formData.points_cost),
    }

    try {
      const url = editingId ? `/api/gifts/${editingId}` : '/api/gifts'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save gift')
        return
      }

      await fetchGifts()
      resetForm()
    } catch {
      setError('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAvailability(gift: Gift) {
    await fetch(`/api/gifts/${gift.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...gift, available: gift.available === 1 ? 0 : 1 }),
    })
    fetchGifts()
  }

  function handleDelete(id: number, name: string) {
    sileo.action({
      title: `Delete "${name}"?`,
      description: 'This gift will be permanently removed.',
      duration: null,
      button: {
        title: 'Delete',
        onClick: async () => {
          const res = await fetch(`/api/gifts/${id}`, { method: 'DELETE' })
          if (res.ok) {
            fetchGifts()
            sileo.success({ title: 'Deleted', description: `"${name}" has been removed.` })
          } else {
            sileo.error({ title: 'Error', description: 'Failed to delete gift.' })
          }
        },
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cfa-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const availableGifts = gifts.filter((g) => g.available === 1)
  const unavailableGifts = gifts.filter((g) => g.available === 0)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cfa-ink">Gifts</h1>
          <p className="text-cfa-ink-soft text-sm mt-0.5">Rewards employees can exchange points for</p>
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
            Add Gift
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-5">
          <h2 className="text-base font-semibold text-cfa-ink mb-4">
            {editingId ? 'Edit Gift' : 'New Gift'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Gift Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Amazon Gift Card"
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Points Cost</label>
                <input
                  type="number"
                  value={formData.points_cost}
                  onChange={(e) => setFormData({ ...formData, points_cost: e.target.value })}
                  required
                  min="1"
                  placeholder="e.g. 500"
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-cfa-ink-soft mb-1">
                Description <span className="text-cfa-ink-dim">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the gift"
                className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
              />
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

      {/* Available Gifts */}
      <div>
        <h2 className="text-sm font-medium text-cfa-ink-soft uppercase tracking-wider mb-3">
          Available Gifts ({availableGifts.length})
        </h2>
        {availableGifts.length === 0 ? (
          <div className="bg-cfa-card rounded-xl border border-cfa-border p-6 text-center">
            <p className="text-cfa-ink-dim text-sm">No available gifts</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableGifts.map((gift) => (
              <div key={gift.id} className="bg-cfa-card rounded-xl border border-cfa-border p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-cfa-ink font-semibold text-sm">{gift.name}</h3>
                    {gift.description && (
                      <p className="text-cfa-ink-soft text-xs mt-0.5">{gift.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">{gift.points_cost.toLocaleString()}</span>
                    <p className="text-cfa-ink-dim text-xs">points</p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => startEdit(gift)}
                      className="flex-1 px-2 py-1 bg-cfa-muted hover:bg-cfa-border text-cfa-ink-soft rounded-lg text-xs transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(gift)}
                      className="flex-1 px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg text-xs transition-colors"
                    >
                      Disable
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(gift.id, gift.name)}
                        className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unavailable Gifts */}
      {unavailableGifts.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-cfa-ink-soft uppercase tracking-wider mb-3">
            Unavailable Gifts ({unavailableGifts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unavailableGifts.map((gift) => (
              <div key={gift.id} className="bg-cfa-card rounded-xl border border-cfa-border/50 p-4 opacity-60">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-cfa-ink font-semibold text-sm">{gift.name}</h3>
                      <span className="text-xs bg-cfa-muted text-cfa-ink-soft px-1.5 py-0.5 rounded-full">Unavailable</span>
                    </div>
                    {gift.description && (
                      <p className="text-cfa-ink-soft text-xs mt-0.5">{gift.description}</p>
                    )}
                  </div>
                  <span className="text-cfa-ink-soft font-bold text-sm flex-shrink-0">{gift.points_cost.toLocaleString()} pts</span>
                </div>
                {canManage && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => startEdit(gift)}
                      className="flex-1 px-2 py-1 bg-cfa-muted hover:bg-cfa-border text-cfa-ink-soft rounded-lg text-xs transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(gift)}
                      className="flex-1 px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-xs transition-colors"
                    >
                      Enable
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(gift.id, gift.name)}
                        className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {gifts.length === 0 && !showForm && (
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-12 text-center">
          <svg className="w-12 h-12 text-cfa-ink-dim mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <p className="text-cfa-ink-soft font-medium">No gifts yet</p>
          {canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add First Gift
            </button>
          )}
        </div>
      )}
    </div>
  )
}
