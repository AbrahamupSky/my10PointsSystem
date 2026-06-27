'use client'

import { useRef, useState } from 'react'
import { sileo } from 'sileo'

interface ParsedEmployee {
  name: string
  email: string
  department: string
}

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text: string): ParsedEmployee[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const rawHeaders = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z]/g, '')
  )

  const nameIdx = rawHeaders.findIndex((h) => h === 'name' || h === 'fullname' || h === 'employeename')
  const emailIdx = rawHeaders.findIndex((h) => h === 'email' || h === 'emailaddress')
  const deptIdx = rawHeaders.findIndex((h) => h === 'department' || h === 'dept' || h === 'position')

  if (nameIdx === -1) return []

  const rows: ParsedEmployee[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const name = nameIdx >= 0 ? (cols[nameIdx] || '') : ''
    if (!name) continue
    rows.push({
      name,
      email: emailIdx >= 0 ? (cols[emailIdx] || '') : '',
      department: deptIdx >= 0 ? (cols[deptIdx] || '') : '',
    })
  }
  return rows
}

const SAMPLE_CSV = `Name,Email,Department
John Smith,john@example.com,FOH
Jane Doe,jane@example.com,BOH
Mike Johnson,,FOH
Sarah Williams,,BOH`

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [rows, setRows] = useState<ParsedEmployee[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview'>('upload')

  if (!isOpen) return null

  function handleFile(file: File) {
    setParseError('')
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Please upload a .csv file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setParseError(
          'Could not parse the file. Make sure it has a "Name" column header and at least one data row.'
        )
        return
      }
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function reset() {
    setRows([])
    setParseError('')
    setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleImport() {
    setImporting(true)
    try {
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: rows }),
      })
      const data = await res.json()
      if (!res.ok) {
        sileo.error({ title: 'Import failed', description: data.error })
      } else {
        sileo.success({
          title: `${data.imported} employee${data.imported !== 1 ? 's' : ''} imported`,
          description: data.skipped.length > 0 ? `${data.skipped.length} row(s) skipped` : undefined,
        })
        onSuccess()
        handleClose()
      }
    } catch {
      sileo.error({ title: 'Import failed', description: 'An unexpected error occurred.' })
    } finally {
      setImporting(false)
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'roster_sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const deptCounts = rows.reduce<Record<string, number>>((acc, r) => {
    const key = r.department.toUpperCase() || 'No dept'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-cfa-card rounded-2xl border border-cfa-border w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cfa-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-cfa-ink">Import Roster</h2>
            <p className="text-cfa-ink-soft text-xs mt-0.5">
              {step === 'upload' ? 'Upload a CSV file to bulk-add employees' : `${rows.length} employees ready to import`}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 text-cfa-ink-soft hover:text-cfa-ink hover:bg-cfa-muted rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragging
                    ? 'border-cfa-red bg-cfa-red/5'
                    : 'border-cfa-border hover:border-cfa-red/50 hover:bg-cfa-muted/50'
                }`}
              >
                <svg className="w-10 h-10 text-cfa-ink-dim mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-cfa-ink font-medium text-sm">Drop your CSV here or click to browse</p>
                <p className="text-cfa-ink-dim text-xs mt-1">.csv files only</p>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={onFileChange} className="hidden" />
              </div>

              {parseError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-600 dark:text-red-400 text-sm">
                  {parseError}
                </div>
              )}

              {/* Format guide */}
              <div className="bg-cfa-muted rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-cfa-ink-soft uppercase tracking-wider">Expected format</p>
                  <button onClick={downloadSample} className="text-xs text-cfa-red hover:text-cfa-red-dark font-medium transition-colors">
                    Download sample
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr>
                        {['Name *', 'Email', 'Department'].map((h) => (
                          <th key={h} className="text-left text-cfa-ink-soft font-semibold pb-1.5 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-cfa-ink-soft">
                      <tr><td className="pr-4 py-0.5">John Smith</td><td className="pr-4">john@example.com</td><td>FOH</td></tr>
                      <tr><td className="pr-4 py-0.5">Jane Doe</td><td className="pr-4"></td><td>BOH</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-cfa-ink-dim">* Required. Department is typically FOH or BOH.</p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-cfa-muted rounded-full text-xs font-medium text-cfa-ink">
                  {rows.length} total
                </span>
                {Object.entries(deptCounts).map(([dept, count]) => (
                  <span key={dept} className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    dept === 'FOH'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      : dept === 'BOH'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-cfa-muted text-cfa-ink-soft border-cfa-border'
                  }`}>
                    {dept}: {count}
                  </span>
                ))}
              </div>

              {/* Preview table */}
              <div className="rounded-xl border border-cfa-border overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-cfa-muted">
                      <tr>
                        <th className="text-left text-xs font-semibold text-cfa-ink-soft uppercase tracking-wider px-4 py-2.5">#</th>
                        <th className="text-left text-xs font-semibold text-cfa-ink-soft uppercase tracking-wider px-4 py-2.5">Name</th>
                        <th className="text-left text-xs font-semibold text-cfa-ink-soft uppercase tracking-wider px-4 py-2.5">Email</th>
                        <th className="text-left text-xs font-semibold text-cfa-ink-soft uppercase tracking-wider px-4 py-2.5">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cfa-border/50">
                      {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-cfa-muted/30">
                          <td className="px-4 py-2.5 text-cfa-ink-dim text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 text-cfa-ink font-medium">{row.name}</td>
                          <td className="px-4 py-2.5 text-cfa-ink-soft">{row.email || <span className="text-cfa-ink-dim italic">—</span>}</td>
                          <td className="px-4 py-2.5">
                            {row.department ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                row.department.toUpperCase() === 'FOH'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : row.department.toUpperCase() === 'BOH'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-cfa-muted text-cfa-ink-soft'
                              }`}>
                                {row.department.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-cfa-ink-dim italic text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cfa-border flex gap-3 flex-shrink-0">
          {step === 'upload' ? (
            <button onClick={handleClose} className="flex-1 px-4 py-2.5 bg-cfa-muted hover:bg-cfa-border text-cfa-ink rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
          ) : (
            <>
              <button onClick={reset} className="px-4 py-2.5 bg-cfa-muted hover:bg-cfa-border text-cfa-ink rounded-xl text-sm font-medium transition-colors">
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cfa-red hover:bg-cfa-red-dark disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {importing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${rows.length} Employee${rows.length !== 1 ? 's' : ''}`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
