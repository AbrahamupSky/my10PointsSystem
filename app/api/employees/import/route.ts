import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'

interface ImportEmployee {
  name: string
  email?: string
  department?: string
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { role: string }
  if (user.role !== 'admin' && user.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { employees } = body as { employees: ImportEmployee[] }

  if (!Array.isArray(employees) || employees.length === 0) {
    return NextResponse.json({ error: 'No employees provided' }, { status: 400 })
  }

  const db = getDb()
  const insert = db.prepare(`
    INSERT INTO employees (name, email, department) VALUES (?, ?, ?)
  `)

  let imported = 0
  const skipped: string[] = []

  const run = db.transaction(() => {
    for (const emp of employees) {
      if (!emp.name?.trim()) {
        skipped.push('Row with empty name was skipped')
        continue
      }
      insert.run(
        emp.name.trim(),
        emp.email?.trim() || null,
        emp.department?.trim() || null
      )
      imported++
    }
  })

  run()

  return NextResponse.json({ imported, skipped })
}
