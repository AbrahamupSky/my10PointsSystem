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
  const categories = db.prepare('SELECT * FROM categories ORDER BY type, name').all()

  return NextResponse.json(categories)
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
  const { name, description, points_value, type } = body

  if (!name || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (points_value === undefined || points_value === null) {
    return NextResponse.json({ error: 'Points value is required' }, { status: 400 })
  }
  if (!type || (type !== 'award' && type !== 'deduct')) {
    return NextResponse.json({ error: 'Type must be award or deduct' }, { status: 400 })
  }

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO categories (name, description, points_value, type)
    VALUES (?, ?, ?, ?)
  `).run(name.trim(), description?.trim() || null, Number(points_value), type)

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid)

  return NextResponse.json(category, { status: 201 })
}
