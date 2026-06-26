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

  const user = session.user as { id: string; role: string }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  const body = await request.json()
  const { notes, edit_notes } = body

  const db = getDb()
  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(Number(params.id)) as {
    id: number
    points: number
    type: string
  } | undefined

  if (!existing) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  db.prepare(`
    UPDATE transactions
    SET notes = ?, edited_at = CURRENT_TIMESTAMP, edited_by = ?, edit_notes = ?
    WHERE id = ?
  `).run(notes?.trim() || null, Number(user.id), edit_notes?.trim() || null, Number(params.id))

  const transaction = db.prepare(`
    SELECT
      t.*,
      e.name as employee_name,
      c.name as category_name,
      g.name as gift_name,
      b.title as bounty_title,
      u.name as created_by_name
    FROM transactions t
    LEFT JOIN employees e ON t.employee_id = e.id
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN gifts g ON t.gift_id = g.id
    LEFT JOIN bounties b ON t.bounty_id = b.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.id = ?
  `).get(Number(params.id))

  return NextResponse.json(transaction)
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
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(Number(params.id)) as {
    id: number
    employee_id: number
    points: number
    type: string
  } | undefined

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  const deleteTransaction = db.transaction(() => {
    // Reverse the points effect
    if (transaction.type === 'gift_exchange') {
      // Gift exchange: reverse current points deduction, lifetime unchanged
      db.prepare(`
        UPDATE employees SET current_points = current_points - ? WHERE id = ?
      `).run(transaction.points, transaction.employee_id)
    } else {
      // Award or deduct: reverse current points
      db.prepare(`
        UPDATE employees SET current_points = current_points - ? WHERE id = ?
      `).run(transaction.points, transaction.employee_id)

      // Only reverse lifetime points for positive transactions
      if (transaction.points > 0) {
        db.prepare(`
          UPDATE employees SET lifetime_points = MAX(0, lifetime_points - ?) WHERE id = ?
        `).run(transaction.points, transaction.employee_id)
      }
    }

    db.prepare('DELETE FROM transactions WHERE id = ?').run(Number(params.id))
  })

  deleteTransaction()

  return NextResponse.json({ success: true })
}
