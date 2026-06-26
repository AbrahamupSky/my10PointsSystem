'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewEmployeePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, department }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create employee')
        return
      }

      router.push('/employees')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/employees"
          className="p-2 text-cfa-ink-soft hover:text-cfa-ink hover:bg-cfa-muted rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-cfa-ink">Add Employee</h1>
          <p className="text-cfa-ink-soft text-sm">Create a new employee profile</p>
        </div>
      </div>

      <div className="bg-cfa-card rounded-xl border border-cfa-border p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-cfa-ink-soft mb-1.5">
              Full Name <span className="text-cfa-red">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter employee name"
              className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2.5 text-cfa-ink placeholder-cfa-ink-dim text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cfa-ink-soft mb-1.5">
              Email <span className="text-cfa-ink-dim">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@company.com"
              className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2.5 text-cfa-ink placeholder-cfa-ink-dim text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cfa-ink-soft mb-1.5">
              Department <span className="text-cfa-ink-dim">(optional)</span>
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering, Sales, Marketing"
              className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2.5 text-cfa-ink placeholder-cfa-ink-dim text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/employees"
              className="flex-1 text-center px-4 py-2.5 bg-cfa-muted hover:bg-cfa-border text-cfa-ink rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-cfa-red hover:bg-cfa-red-dark disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
