import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(Number(params.id))

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  const transactions = db.prepare(`
    SELECT
      t.*,
      c.name as category_name,
      g.name as gift_name,
      b.title as bounty_title,
      u.name as created_by_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN gifts g ON t.gift_id = g.id
    LEFT JOIN bounties b ON t.bounty_id = b.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.employee_id = ?
    ORDER BY t.created_at DESC
  `).all(Number(params.id))

  return NextResponse.json({ employee, transactions })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const existing = db.prepare('SELECT id FROM employees WHERE id = ?').get(Number(params.id))
  if (!existing) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  db.prepare(`
    UPDATE employees SET name = ?, email = ?, department = ?
    WHERE id = ?
  `).run(name.trim(), email?.trim() || null, department?.trim() || null, Number(params.id))

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(Number(params.id))
  return NextResponse.json(employee)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { role: string }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM employees WHERE id = ?').get(Number(params.id))
  if (!existing) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  db.prepare('DELETE FROM transactions WHERE employee_id = ?').run(Number(params.id))
  db.prepare('DELETE FROM employees WHERE id = ?').run(Number(params.id))

  return NextResponse.json({ success: true })
}
