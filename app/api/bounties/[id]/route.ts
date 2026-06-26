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
  const { title, description, points_reward, active, deadline } = body

  const db = getDb()
  const existing = db.prepare('SELECT id FROM bounties WHERE id = ?').get(Number(params.id))
  if (!existing) {
    return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
  }

  db.prepare(`
    UPDATE bounties
    SET title = ?, description = ?, points_reward = ?, active = ?, deadline = ?
    WHERE id = ?
  `).run(
    title?.trim(),
    description?.trim() || null,
    Number(points_reward),
    active !== undefined ? (active ? 1 : 0) : 1,
    deadline || null,
    Number(params.id)
  )

  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(Number(params.id))
  return NextResponse.json(bounty)
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
  const existing = db.prepare('SELECT id FROM bounties WHERE id = ?').get(Number(params.id))
  if (!existing) {
    return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
  }

  db.prepare('DELETE FROM bounties WHERE id = ?').run(Number(params.id))

  return NextResponse.json({ success: true })
}
