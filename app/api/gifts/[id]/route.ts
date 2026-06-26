import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'

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
  const { name, description, points_cost, available } = body

  const db = getDb()
  const existing = db.prepare('SELECT id FROM gifts WHERE id = ?').get(Number(params.id))
  if (!existing) {
    return NextResponse.json({ error: 'Gift not found' }, { status: 404 })
  }

  db.prepare(`
    UPDATE gifts
    SET name = ?, description = ?, points_cost = ?, available = ?
    WHERE id = ?
  `).run(
    name?.trim(),
    description?.trim() || null,
    Number(points_cost),
    available !== undefined ? (available ? 1 : 0) : 1,
    Number(params.id)
  )

  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(Number(params.id))
  return NextResponse.json(gift)
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
  const existing = db.prepare('SELECT id FROM gifts WHERE id = ?').get(Number(params.id))
  if (!existing) {
    return NextResponse.json({ error: 'Gift not found' }, { status: 404 })
  }

  db.prepare('DELETE FROM gifts WHERE id = ?').run(Number(params.id))

  return NextResponse.json({ success: true })
}
