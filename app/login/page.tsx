'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/')
    }
  }, [session, status, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cfa-surface">
        <div className="w-8 h-8 border-2 border-cfa-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cfa-surface">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-cfa-red rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cfa-red/20">
            <span className="text-white font-bold text-2xl">10</span>
          </div>
          <h1 className="text-2xl font-bold text-cfa-ink">My10 Points System</h1>
          <p className="text-cfa-ink-soft text-sm mt-1">Employee Rewards Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-cfa-ink mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@my10points.com"
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
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2.5 text-cfa-ink placeholder-cfa-ink-dim text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red focus:border-transparent transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cfa-red hover:bg-cfa-red-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
