import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const employees = db.prepare(`
    SELECT * FROM employees ORDER BY lifetime_points DESC
  `).all()

  return NextResponse.json(employees)
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
  const { name, email, department } = body

  if (!name || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO employees (name, email, department)
    VALUES (?, ?, ?)
  `).run(name.trim(), email?.trim() || null, department?.trim() || null)

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid)

  return NextResponse.json(employee, { status: 201 })
}
