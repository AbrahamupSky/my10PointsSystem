'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TierBadge from '@/components/TierBadge'
import PointsModal from '@/components/PointsModal'
import ImportModal from '@/components/ImportModal'
import { useSession } from 'next-auth/react'
import { sileo } from 'sileo'

interface Employee {
  id: number
  name: string
  email: string | null
  department: string | null
  current_points: number
  lifetime_points: number
  created_at: string
}

export default function EmployeesPage() {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>()

  const user = session?.user as { role?: string } | undefined
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const isAdmin = user?.role === 'admin'

  async function fetchEmployees() {
    const res = await fetch('/api/employees')
    if (res.ok) {
      setEmployees(await res.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[]

  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']

  function getEmployeeTier(lifetimePoints: number) {
    if (lifetimePoints >= 10000) return 'Diamond'
    if (lifetimePoints >= 6000) return 'Platinum'
    if (lifetimePoints >= 3000) return 'Gold'
    if (lifetimePoints >= 1000) return 'Silver'
    return 'Bronze'
  }

  const filtered = employees.filter((emp) => {
    const matchSearch =
      !search ||
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase())

    const matchDept = !departmentFilter || emp.department === departmentFilter
    const matchTier = !tierFilter || getEmployeeTier(emp.lifetime_points) === tierFilter

    return matchSearch && matchDept && matchTier
  })

  function handleDelete(id: number, name: string) {
    sileo.action({
      title: `Delete "${name}"?`,
      description: 'This will also delete all their transactions.',
      duration: null,
      button: {
        title: 'Delete',
        onClick: async () => {
          const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
          if (res.ok) {
            fetchEmployees()
            sileo.success({ title: 'Deleted', description: `${name} has been removed.` })
          } else {
            sileo.error({ title: 'Error', description: 'Failed to delete employee.' })
          }
        },
      },
    })
  }

  function openAwardModal(employeeId: number) {
    setSelectedEmployeeId(employeeId)
    setModalOpen(true)
  }

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
          <h1 className="text-2xl font-bold text-cfa-ink">Employees</h1>
          <p className="text-cfa-ink-soft text-sm mt-0.5">{employees.length} total employees</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cfa-muted hover:bg-cfa-border text-cfa-ink rounded-lg text-sm font-medium transition-colors border border-cfa-border"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Roster
            </button>
            <Link
              href="/employees/new"
              className="flex items-center gap-2 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Employee
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cfa-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full bg-cfa-card border border-cfa-border rounded-lg pl-9 pr-3 py-2 text-cfa-ink text-sm placeholder-cfa-ink-dim focus:outline-none focus:ring-2 focus:ring-cfa-red"
          />
        </div>
        {departments.length > 0 && (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-cfa-card border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        )}
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="bg-cfa-card border border-cfa-border rounded-lg px-3 py-2 text-cfa-ink text-sm focus:outline-none focus:ring-2 focus:ring-cfa-red"
        >
          <option value="">All Tiers</option>
          {tiers.map((tier) => (
            <option key={tier} value={tier}>{tier}</option>
          ))}
        </select>
      </div>

      {/* Employee Grid */}
      {filtered.length === 0 ? (
        <div className="bg-cfa-card rounded-xl border border-cfa-border p-12 text-center">
          <svg className="w-12 h-12 text-cfa-ink-dim mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-cfa-ink-soft font-medium">
            {search || departmentFilter || tierFilter ? 'No employees match your filters' : 'No employees yet'}
          </p>
          {canManage && !search && !departmentFilter && !tierFilter && (
            <Link
              href="/employees/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-cfa-red hover:bg-cfa-red-dark text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add First Employee
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="bg-cfa-card rounded-xl border border-cfa-border p-5 hover:border-cfa-red/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/employees/${emp.id}`}
                    className="text-cfa-ink font-semibold hover:text-cfa-red transition-colors truncate block"
                  >
                    {emp.name}
                  </Link>
                  {emp.department && (
                    <p className="text-cfa-ink-soft text-xs mt-0.5">{emp.department}</p>
                  )}
                  {emp.email && (
                    <p className="text-cfa-ink-dim text-xs mt-0.5 truncate">{emp.email}</p>
                  )}
                </div>
                <TierBadge lifetimePoints={emp.lifetime_points} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-cfa-muted rounded-lg p-2.5">
                  <p className="text-cfa-ink-soft text-xs">Current</p>
                  <p className="text-cfa-ink font-bold text-lg">{emp.current_points.toLocaleString()}</p>
                </div>
                <div className="bg-cfa-muted rounded-lg p-2.5">
                  <p className="text-cfa-ink-soft text-xs">Lifetime</p>
                  <p className="text-cfa-ink font-bold text-lg">{emp.lifetime_points.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/employees/${emp.id}`}
                  className="flex-1 text-center px-3 py-1.5 bg-cfa-muted hover:bg-cfa-border text-cfa-ink rounded-lg text-xs font-medium transition-colors"
                >
                  View
                </Link>
                {canManage && (
                  <button
                    onClick={() => openAwardModal(emp.id)}
                    className="flex-1 px-3 py-1.5 bg-cfa-red hover:bg-cfa-red-dark text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Award
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(emp.id, emp.name)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PointsModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedEmployeeId(undefined)
        }}
        onSuccess={fetchEmployees}
        defaultEmployeeId={selectedEmployeeId}
      />

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={fetchEmployees}
      />
    </div>
  )
}
