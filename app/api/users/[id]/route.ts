import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = session.user as { id: string; role: string }
  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const targetId = parseInt(params.id, 10)
  if (isNaN(targetId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
  }

  if (String(targetId) === currentUser.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId)
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(targetId)

  return NextResponse.json({ success: true })
}
