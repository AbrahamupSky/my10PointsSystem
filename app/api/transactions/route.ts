import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employee_id')
  const limit = searchParams.get('limit') || '50'
  const offset = searchParams.get('offset') || '0'

  const db = getDb()

  let query = `
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
  `

  const params: (string | number)[] = []

  if (employeeId) {
    query += ' WHERE t.employee_id = ?'
    params.push(Number(employeeId))
  }

  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), Number(offset))

  const transactions = db.prepare(query).all(...params)

  return NextResponse.json(transactions)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as { id: string; role: string }
  if (user.role !== 'admin' && user.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { employee_id, type, category_id, gift_id, bounty_id, points, notes } = body

  if (!employee_id) {
    return NextResponse.json({ error: 'Employee is required' }, { status: 400 })
  }
  if (!type || !['award', 'deduct', 'gift_exchange', 'bounty', 'forgiveness'].includes(type)) {
    return NextResponse.json({ error: 'Valid transaction type is required' }, { status: 400 })
  }
  if (points === undefined || points === null) {
    return NextResponse.json({ error: 'Points value is required' }, { status: 400 })
  }

  const db = getDb()

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(Number(employee_id)) as {
    id: number
    current_points: number
    lifetime_points: number
  } | undefined

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  let actualPoints = Number(points)
  let giftCost = 0

  if (type === 'gift_exchange') {
    if (!gift_id) {
      return NextResponse.json({ error: 'Gift is required for gift exchange' }, { status: 400 })
    }
    const gift = db.prepare('SELECT * FROM gifts WHERE id = ? AND available = 1').get(Number(gift_id)) as {
      id: number
      points_cost: number
    } | undefined
    if (!gift) {
      return NextResponse.json({ error: 'Gift not found or unavailable' }, { status: 404 })
    }
    giftCost = gift.points_cost
    actualPoints = -giftCost

    if (employee.current_points < giftCost) {
      return NextResponse.json({ error: 'Employee does not have enough points' }, { status: 400 })
    }
  }

  if (type === 'bounty') {
    if (!bounty_id) {
      return NextResponse.json({ error: 'Bounty is required for bounty transaction' }, { status: 400 })
    }
    const bounty = db.prepare('SELECT * FROM bounties WHERE id = ? AND active = 1').get(Number(bounty_id)) as {
      id: number
      points_reward: number
    } | undefined
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found or inactive' }, { status: 404 })
    }
    actualPoints = bounty.points_reward
  }

  if (type === 'forgiveness') {
    actualPoints = Math.abs(Number(points))
    if (actualPoints <= 0) {
      return NextResponse.json({ error: 'Forgiveness points must be greater than zero' }, { status: 400 })
    }
  }

  const insertTransaction = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO transactions (employee_id, type, category_id, gift_id, bounty_id, points, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(employee_id),
      type,
      category_id ? Number(category_id) : null,
      gift_id ? Number(gift_id) : null,
      bounty_id ? Number(bounty_id) : null,
      actualPoints,
      notes?.trim() || null,
      Number(user.id)
    )

    // Update employee points
    if (type === 'gift_exchange') {
      // Gift exchange: deduct current points, lifetime unchanged
      db.prepare(`
        UPDATE employees SET current_points = current_points + ? WHERE id = ?
      `).run(actualPoints, Number(employee_id))
    } else {
      // Award or deduct: update current points
      db.prepare(`
        UPDATE employees SET current_points = current_points + ? WHERE id = ?
      `).run(actualPoints, Number(employee_id))

      // Only increase lifetime points for positive transactions
      if (actualPoints > 0) {
        db.prepare(`
          UPDATE employees SET lifetime_points = lifetime_points + ? WHERE id = ?
        `).run(actualPoints, Number(employee_id))
      }
    }

    return result.lastInsertRowid
  })

  const transactionId = insertTransaction()
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
  `).get(transactionId)

  return NextResponse.json(transaction, { status: 201 })
}
