'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface AppUser {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

export default function RegisterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'viewer' | 'manager' | 'admin'>('viewer')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentUser = session?.user as { role?: string } | undefined
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    if (status === 'loading') return
    if (!isAdmin) {
      router.replace('/')
    }
  }, [status, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        setUsers(data)
        setLoadingUsers(false)
      })
  }, [isAdmin])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create user')
      } else {
        setSuccess(`User "${data.name}" created successfully`)
        setUsers((prev) => [data, ...prev])
        setName('')
        setEmail('')
        setPassword('')
        setRole('viewer')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cfa-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-cfa-ink">User Management</h1>
        <p className="text-cfa-ink-soft text-sm mt-0.5">Create and manage system users</p>
      </div>

      {/* Create User Form */}
      <div className="bg-cfa-card rounded-xl border border-cfa-border p-6">
        <h2 className="text-base font-semibold text-cfa-ink mb-5">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2.5 text-cfa-ink placeholder-cfa-ink-dim text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="jane@example.com"
                className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2.5 text-cfa-ink placeholder-cfa-ink-dim text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2.5 text-cfa-ink placeholder-cfa-ink-dim text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2.5 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red focus:border-transparent transition-colors"
              >
                <option value="viewer">Viewer — read-only access</option>
                <option value="manager">Manager — can create transactions</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-green-600 dark:text-green-400 text-sm">
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-cfa-red hover:bg-cfa-red-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Users */}
      <div className="bg-cfa-card rounded-xl border border-cfa-border overflow-hidden">
        <div className="px-6 py-4 border-b border-cfa-border">
          <h2 className="text-base font-semibold text-cfa-ink">Existing Users</h2>
        </div>
        {loadingUsers ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-6 h-6 border-2 border-cfa-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-cfa-border/50">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-cfa-ink text-sm font-medium">{u.name}</p>
                  <p className="text-cfa-ink-soft text-xs">{u.email}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                    u.role === 'admin'
                      ? 'bg-cfa-red/10 text-cfa-red border-cfa-red/30'
                      : u.role === 'manager'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                      : 'bg-cfa-muted text-cfa-ink-soft border-cfa-border'
                  }`}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
