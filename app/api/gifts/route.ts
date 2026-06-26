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
  const gifts = db.prepare('SELECT * FROM gifts ORDER BY points_cost ASC').all()

  return NextResponse.json(gifts)
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
  const { name, description, points_cost } = body

  if (!name || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (points_cost === undefined || points_cost === null || Number(points_cost) <= 0) {
    return NextResponse.json({ error: 'Valid points cost is required' }, { status: 400 })
  }

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO gifts (name, description, points_cost)
    VALUES (?, ?, ?)
  `).run(name.trim(), description?.trim() || null, Number(points_cost))

  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(result.lastInsertRowid)

  return NextResponse.json(gift, { status: 201 })
}
