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
  const bounties = db.prepare('SELECT * FROM bounties ORDER BY created_at DESC').all()

  return NextResponse.json(bounties)
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
  const { title, description, points_reward, deadline } = body

  if (!title || title.trim() === '') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (points_reward === undefined || points_reward === null || Number(points_reward) <= 0) {
    return NextResponse.json({ error: 'Valid points reward is required' }, { status: 400 })
  }

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO bounties (title, description, points_reward, deadline)
    VALUES (?, ?, ?, ?)
  `).run(title.trim(), description?.trim() || null, Number(points_reward), deadline || null)

  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(result.lastInsertRowid)

  return NextResponse.json(bounty, { status: 201 })
}
