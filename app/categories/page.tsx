'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { sileo } from 'sileo'

interface Category {
  id: number
  name: string
  description: string | null
  points_value: number
  type: 'award' | 'deduct'
  active: number
  created_at: string
}

export default function CategoriesPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_value: '',
    type: 'award' as 'award' | 'deduct',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const user = session?.user as { role?: string } | undefined
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const isAdmin = user?.role === 'admin'

  async function fetchCategories() {
    const res = await fetch('/api/categories')
    if (res.ok) setCategories(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  function resetForm() {
    setFormData({ name: '', description: '', points_value: '', type: 'award' })
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  function startEdit(cat: Category) {
    setFormData({
      name: cat.name,
      description: cat.description || '',
      points_value: String(Math.abs(cat.points_value)),
      type: cat.type,
    })
    setEditingId(cat.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const pointsValue = formData.type === 'deduct'
      ? -Math.abs(Number(formData.points_value))
      : Math.abs(Number(formData.points_value))

    const body = {
      name: formData.name,
      description: formData.description,
      points_value: pointsValue,
      type: formData.type,
    }

    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save category')
        return
      }

      await fetchCategories()
      resetForm()
    } catch {
      setError('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(cat: Category) {
    await fetch(`/api/categories/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cat, active: cat.active === 1 ? 0 : 1 }),
    })
    fetchCategories()
  }

  function handleDelete(id: number, name: string) {
    sileo.action({
      title: `Delete "${name}"?`,
      description: 'This category will be permanently removed.',
      duration: null,
      button: {
        title: 'Delete',
        onClick: async () => {
          const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
          if (res.ok) {
            fetchCategories()
            sileo.success({ title: 'Deleted', description: `"${name}" has been removed.` })
          } else {
            sileo.error({ title: 'Error', description: 'Failed to delete category.' })
          }
        },
      },
    })
  }

  const awardCategories = categories.filter((c) => c.type === 'award')
  const deductCategories = categories.filter((c) => c.type === 'deduct')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cfa-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cfa-ink">Categories</h1>
          <p className="text-cfa-ink-soft text-sm mt-0.5">Task types for awarding or deducting points</p>
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
            Add Category
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-5">
          <h2 className="text-base font-semibold text-cfa-ink mb-4">
            {editingId ? 'Edit Category' : 'New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Category name"
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'award' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      formData.type === 'award'
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-cfa-muted border-cfa-border text-cfa-ink-soft hover:text-cfa-ink'
                    }`}
                  >
                    Award
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'deduct' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      formData.type === 'deduct'
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-cfa-muted border-cfa-border text-cfa-ink-soft hover:text-cfa-ink'
                    }`}
                  >
                    Deduct
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Points Value</label>
                <input
                  type="number"
                  value={formData.points_value}
                  onChange={(e) => setFormData({ ...formData, points_value: e.target.value })}
                  required
                  min="1"
                  placeholder="e.g. 50"
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                />
                <p className="text-cfa-ink-dim text-xs mt-1">
                  {formData.type === 'deduct' ? 'Will be stored as negative' : 'Positive value'}
                </p>
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

      {/* Award Categories */}
      <div>
        <h2 className="text-sm font-medium text-cfa-ink-soft uppercase tracking-wider mb-3">
          Award Categories ({awardCategories.length})
        </h2>
        {awardCategories.length === 0 ? (
          <div className="bg-cfa-card rounded-xl border border-cfa-border p-6 text-center">
            <p className="text-cfa-ink-dim text-sm">No award categories yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {awardCategories.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center gap-4 p-4 bg-cfa-card rounded-xl border transition-colors ${
                  cat.active ? 'border-cfa-border' : 'border-cfa-border/50 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-cfa-ink font-medium text-sm">{cat.name}</span>
                    {!cat.active && (
                      <span className="text-xs bg-cfa-muted text-cfa-ink-soft px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  {cat.description && (
                    <p className="text-cfa-ink-soft text-xs mt-0.5">{cat.description}</p>
                  )}
                </div>
                <span className="text-green-600 dark:text-green-400 font-bold text-sm flex-shrink-0">
                  +{cat.points_value} pts
                </span>
                {canManage && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 text-cfa-ink-soft hover:text-cfa-ink hover:bg-cfa-muted rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        cat.active
                          ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10'
                          : 'text-green-600 dark:text-green-400 hover:bg-green-500/10'
                      }`}
                      title={cat.active ? 'Deactivate' : 'Activate'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deduct Categories */}
      <div>
        <h2 className="text-sm font-medium text-cfa-ink-soft uppercase tracking-wider mb-3">
          Deduction Categories ({deductCategories.length})
        </h2>
        {deductCategories.length === 0 ? (
          <div className="bg-cfa-card rounded-xl border border-cfa-border p-6 text-center">
            <p className="text-cfa-ink-dim text-sm">No deduction categories yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deductCategories.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center gap-4 p-4 bg-cfa-card rounded-xl border transition-colors ${
                  cat.active ? 'border-cfa-border' : 'border-cfa-border/50 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-cfa-ink font-medium text-sm">{cat.name}</span>
                    {!cat.active && (
                      <span className="text-xs bg-cfa-muted text-cfa-ink-soft px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  {cat.description && (
                    <p className="text-cfa-ink-soft text-xs mt-0.5">{cat.description}</p>
                  )}
                </div>
                <span className="text-red-600 dark:text-red-400 font-bold text-sm flex-shrink-0">
                  {cat.points_value} pts
                </span>
                {canManage && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 text-cfa-ink-soft hover:text-cfa-ink hover:bg-cfa-muted rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002 2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        cat.active
                          ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10'
                          : 'text-green-600 dark:text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
