'use client'

import { useState, useEffect } from 'react'

interface Employee {
  id: number
  name: string
  current_points: number
  department?: string
}

interface Category {
  id: number
  name: string
  points_value: number
  type: string
}

interface Gift {
  id: number
  name: string
  points_cost: number
  available: number
}

interface Bounty {
  id: number
  title: string
  points_reward: number
  active: number
}

type ModalType = 'award' | 'deduct' | 'forgiveness' | 'gift_exchange' | 'bounty'

interface PointsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultType?: ModalType
  defaultEmployeeId?: number
}

export default function PointsModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'award',
  defaultEmployeeId,
}: PointsModalProps) {
  const [type, setType] = useState<ModalType>(defaultType)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [gifts, setGifts] = useState<Gift[]>([])
  const [bounties, setBounties] = useState<Bounty[]>([])

  const [employeeId, setEmployeeId] = useState<string>(defaultEmployeeId ? String(defaultEmployeeId) : '')
  const [categoryId, setCategoryId] = useState<string>('')
  const [giftId, setGiftId] = useState<string>('')
  const [bountyId, setBountyId] = useState<string>('')
  const [points, setPoints] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      fetchData()
      setType(defaultType)
      setEmployeeId(defaultEmployeeId ? String(defaultEmployeeId) : '')
      setCategoryId('')
      setGiftId('')
      setBountyId('')
      setPoints('')
      setNotes('')
      setError('')
    }
  }, [isOpen, defaultType, defaultEmployeeId])

  async function fetchData() {
    const [empRes, catRes, giftRes, bountyRes] = await Promise.all([
      fetch('/api/employees'),
      fetch('/api/categories'),
      fetch('/api/gifts'),
      fetch('/api/bounties'),
    ])
    if (empRes.ok) setEmployees(await empRes.json())
    if (catRes.ok) setCategories(await catRes.json())
    if (giftRes.ok) setGifts((await giftRes.json()).filter((g: Gift) => g.available === 1))
    if (bountyRes.ok) setBounties((await bountyRes.json()).filter((b: Bounty) => b.active === 1))
  }

  const filteredCategories = categories.filter((c) => {
    if (type === 'award') return c.type === 'award'
    if (type === 'deduct') return c.type === 'deduct'
    return false
  })

  const selectedEmployee = employees.find((e) => e.id === Number(employeeId))
  const selectedGift = gifts.find((g) => g.id === Number(giftId))
  const selectedBounty = bounties.find((b) => b.id === Number(bountyId))
  const selectedCategory = categories.find((c) => c.id === Number(categoryId))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!employeeId) {
      setError('Please select an employee')
      return
    }

    let body: Record<string, string | number | undefined> = {
      employee_id: Number(employeeId),
      type,
      notes,
    }

    if (type === 'award' || type === 'deduct') {
      if (!points && !categoryId) {
        setError('Please enter points or select a category')
        return
      }
      body.category_id = categoryId ? Number(categoryId) : undefined
      body.points = categoryId && selectedCategory ? selectedCategory.points_value : Number(points)
    } else if (type === 'forgiveness') {
      if (!points || Number(points) <= 0) {
        setError('Please enter the points to forgive')
        return
      }
      body.points = Number(points)
    } else if (type === 'gift_exchange') {
      if (!giftId) {
        setError('Please select a gift')
        return
      }
      body.gift_id = Number(giftId)
      body.points = selectedGift ? -selectedGift.points_cost : 0
    } else if (type === 'bounty') {
      if (!bountyId) {
        setError('Please select a bounty')
        return
      }
      body.bounty_id = Number(bountyId)
      body.points = selectedBounty ? selectedBounty.points_reward : 0
    }

    setLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create transaction')
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-cfa-card rounded-xl border border-cfa-border w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cfa-border">
          <h2 className="text-lg font-semibold text-cfa-ink">New Transaction</h2>
          <button onClick={onClose} className="text-cfa-ink-soft hover:text-cfa-ink transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-cfa-ink-soft mb-2">Transaction Type</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {(['award', 'deduct', 'forgiveness', 'gift_exchange', 'bounty'] as ModalType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t)
                    setCategoryId('')
                    setGiftId('')
                    setBountyId('')
                    setPoints('')
                  }}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                    type === t
                      ? t === 'award' || t === 'bounty'
                        ? 'bg-green-600 border-green-500 text-white'
                        : t === 'deduct'
                        ? 'bg-red-600 border-red-500 text-white'
                        : t === 'forgiveness'
                        ? 'bg-teal-600 border-teal-500 text-white'
                        : 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-cfa-muted border-cfa-border text-cfa-ink-soft hover:text-cfa-ink hover:bg-cfa-border'
                  }`}
                >
                  {t === 'gift_exchange' ? 'Gift' : t === 'bounty' ? 'Bounty' : t === 'forgiveness' ? 'Forgive' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Employee */}
          <div>
            <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.current_points} pts
                  {emp.department ? ` (${emp.department})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Award/Deduct: Category */}
          {(type === 'award' || type === 'deduct') && (
            <>
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">
                  Category <span className="text-cfa-ink-dim">(optional)</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value)
                    if (e.target.value) {
                      const cat = categories.find((c) => c.id === Number(e.target.value))
                      if (cat) setPoints(String(Math.abs(cat.points_value)))
                    }
                  }}
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                >
                  <option value="">Select category...</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.points_value > 0 ? '+' : ''}{cat.points_value} pts)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">
                  Points {type === 'deduct' ? '(will be deducted)' : ''}
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  min="1"
                  placeholder="Enter points..."
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                />
              </div>
            </>
          )}

          {/* Forgiveness */}
          {type === 'forgiveness' && (
            <div className="space-y-3">
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-2.5 text-teal-700 dark:text-teal-400 text-xs">
                Forgiveness restores points to the employee&apos;s current balance <strong>and</strong> adds them to their lifetime total — use this when a penalty is no longer warranted.
              </div>
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Points to Forgive</label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  min="1"
                  placeholder="e.g. 10"
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* Gift Exchange */}
          {type === 'gift_exchange' && (
            <div>
              <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Gift</label>
              <select
                value={giftId}
                onChange={(e) => setGiftId(e.target.value)}
                className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
              >
                <option value="">Select gift...</option>
                {gifts.map((gift) => (
                  <option key={gift.id} value={gift.id}>
                    {gift.name} — {gift.points_cost} pts
                  </option>
                ))}
              </select>
              {selectedEmployee && selectedGift && (
                <p className={`mt-1 text-xs ${selectedEmployee.current_points >= selectedGift.points_cost ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  Employee has {selectedEmployee.current_points} pts.{' '}
                  {selectedEmployee.current_points >= selectedGift.points_cost
                    ? `After exchange: ${selectedEmployee.current_points - selectedGift.points_cost} pts`
                    : 'Not enough points!'}
                </p>
              )}
            </div>
          )}

          {/* Bounty */}
          {type === 'bounty' && (
            <div>
              <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Bounty</label>
              <select
                value={bountyId}
                onChange={(e) => setBountyId(e.target.value)}
                className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
              >
                <option value="">Select bounty...</option>
                {bounties.map((bounty) => (
                  <option key={bounty.id} value={bounty.id}>
                    {bounty.title} — +{bounty.points_reward} pts
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-cfa-ink-soft mb-1">
              Notes <span className="text-cfa-ink-dim">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add notes..."
              className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-cfa-muted hover:bg-cfa-border text-cfa-ink rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
