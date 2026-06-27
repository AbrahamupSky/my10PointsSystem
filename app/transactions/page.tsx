'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import PointsModal from '@/components/PointsModal'
import { sileo } from 'sileo'

interface Transaction {
  id: number
  employee_id: number
  type: string
  points: number
  notes: string | null
  created_at: string
  edited_at: string | null
  edit_notes: string | null
  employee_name: string
  category_name: string | null
  gift_name: string | null
  bounty_title: string | null
  created_by_name: string | null
}

export default function TransactionsPage() {
  const { data: session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editReasonNotes, setEditReasonNotes] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const user = session?.user as { role?: string } | undefined
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const isAdmin = user?.role === 'admin'

  const LIMIT = 20

  async function fetchTransactions(reset = false) {
    const currentPage = reset ? 0 : page
    const offset = currentPage * LIMIT
    const res = await fetch(`/api/transactions?limit=${LIMIT}&offset=${offset}`)
    if (res.ok) {
      const data = await res.json()
      if (reset) {
        setTransactions(data)
        setPage(0)
      } else {
        setTransactions((prev) => [...prev, ...data])
      }
      setHasMore(data.length === LIMIT)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTransactions(true)
  }, [])

  function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetch(`/api/transactions?limit=${LIMIT}&offset=${nextPage * LIMIT}`)
      .then((r) => r.json())
      .then((data) => {
        setTransactions((prev) => [...prev, ...data])
        setHasMore(data.length === LIMIT)
      })
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
    if (tx.type === 'forgiveness') return 'Debt Forgiveness'
    return tx.type
  }

  function getTypeBadge(type: string) {
    const styles: Record<string, string> = {
      award: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
      deduct: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
      gift_exchange: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
      bounty: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
      forgiveness: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700',
    }
    return styles[type] || 'bg-cfa-muted text-cfa-ink-soft border-cfa-border'
  }

  function handleDelete(id: number) {
    sileo.action({
      title: 'Delete transaction?',
      description: 'This will reverse the points change.',
      duration: null,
      button: {
        title: 'Delete',
        onClick: async () => {
          const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
          if (res.ok) {
            setTransactions((prev) => prev.filter((tx) => tx.id !== id))
            sileo.success({ title: 'Deleted', description: 'Transaction has been reversed.' })
          } else {
            sileo.error({ title: 'Error', description: 'Failed to delete transaction.' })
          }
        },
      },
    })
  }

  function startEdit(tx: Transaction) {
    setEditingTx(tx)
    setEditNotes(tx.notes || '')
    setEditReasonNotes('')
  }

  async function handleSaveEdit() {
    if (!editingTx) return
    setSavingEdit(true)
    const res = await fetch(`/api/transactions/${editingTx.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: editNotes, edit_notes: editReasonNotes }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTransactions((prev) => prev.map((tx) => (tx.id === editingTx.id ? updated : tx)))
      setEditingTx(null)
    }
    setSavingEdit(false)
  }

  const filteredTransactions = typeFilter
    ? transactions.filter((tx) => tx.type === typeFilter)
    : transactions

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
          <h1 className="text-2xl font-bold text-cfa-ink">Transactions</h1>
          <p className="text-cfa-ink-soft text-sm mt-0.5">Complete transaction log</p>
        </div>
        {canManage && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Transaction
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'award', 'deduct', 'gift_exchange', 'bounty'].map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
              typeFilter === type
                ? 'bg-cfa-red border-cfa-red text-white'
                : 'bg-cfa-card border-cfa-border text-cfa-ink-soft hover:text-cfa-ink hover:bg-cfa-muted'
            }`}
          >
            {type === '' ? 'All' : type === 'gift_exchange' ? 'Gift Exchange' : type}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-12 text-center">
          <svg className="w-12 h-12 text-cfa-ink-dim mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-cfa-ink-soft font-medium">No transactions found</p>
        </div>
      ) : (
        <div className="bg-cfa-card rounded-xl border border-cfa-border overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cfa-border">
                  <th className="text-left text-xs font-medium text-cfa-ink-soft uppercase tracking-wider px-4 py-3">Employee</th>
                  <th className="text-left text-xs font-medium text-cfa-ink-soft uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-cfa-ink-soft uppercase tracking-wider px-4 py-3">Details</th>
                  <th className="text-right text-xs font-medium text-cfa-ink-soft uppercase tracking-wider px-4 py-3">Points</th>
                  <th className="text-left text-xs font-medium text-cfa-ink-soft uppercase tracking-wider px-4 py-3">Date</th>
                  {isAdmin && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-cfa-border/50">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-cfa-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-cfa-ink text-sm font-medium">{tx.employee_name}</p>
                      {tx.created_by_name && (
                        <p className="text-cfa-ink-dim text-xs">by {tx.created_by_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border capitalize ${getTypeBadge(tx.type)}`}>
                        {tx.type === 'gift_exchange' ? 'Gift' : tx.type === 'forgiveness' ? 'Forgive' : tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-48">
                      <p className="text-cfa-ink-soft text-sm truncate">{getTransactionLabel(tx)}</p>
                      {tx.notes && <p className="text-cfa-ink-dim text-xs truncate mt-0.5">{tx.notes}</p>}
                      {tx.edited_at && (
                        <p className="text-yellow-600/70 dark:text-yellow-500/70 text-xs mt-0.5">
                          Edited {formatDate(tx.edited_at)}
                          {tx.edit_notes && `: ${tx.edit_notes}`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${tx.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-cfa-ink-soft text-xs">{formatDate(tx.created_at)}</p>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(tx)}
                            className="p-1.5 text-cfa-ink-soft hover:text-cfa-ink hover:bg-cfa-muted rounded transition-colors"
                            title="Edit notes"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete transaction"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="sm:hidden divide-y divide-cfa-border/50">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-cfa-ink text-sm font-medium">{tx.employee_name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${getTypeBadge(tx.type)}`}>
                        {tx.type === 'gift_exchange' ? 'Gift' : tx.type === 'forgiveness' ? 'Forgive' : tx.type}
                      </span>
                    </div>
                    <p className="text-cfa-ink-soft text-xs mt-1">{getTransactionLabel(tx)}</p>
                    {tx.notes && <p className="text-cfa-ink-dim text-xs mt-0.5">{tx.notes}</p>}
                    <p className="text-cfa-ink-dim text-xs mt-1">{formatDate(tx.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-sm font-bold ${tx.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </span>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(tx)}
                          className="p-1 text-cfa-ink-soft hover:text-cfa-ink"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1 text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="p-4 border-t border-cfa-border">
              <button
                onClick={loadMore}
                className="w-full py-2 text-cfa-ink-soft hover:text-cfa-ink text-sm transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingTx(null)} />
          <div className="relative bg-cfa-card rounded-xl border border-cfa-border w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-cfa-ink mb-4">Edit Transaction Notes</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cfa-ink-soft mb-1">
                  Reason for Edit <span className="text-cfa-ink-dim">(optional)</span>
                </label>
                <input
                  type="text"
                  value={editReasonNotes}
                  onChange={(e) => setEditReasonNotes(e.target.value)}
                  placeholder="Why are you editing this?"
                  className="w-full bg-cfa-muted border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingTx(null)}
                  className="flex-1 px-4 py-2 bg-cfa-muted hover:bg-cfa-border text-cfa-ink rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex-1 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PointsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchTransactions(true)}
      />
    </div>
  )
}
