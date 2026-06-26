import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { getTier } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()

  // Total employees
  const { count: totalEmployees } = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number }

  // Total points awarded (sum of positive transactions)
  const { total: totalPointsAwarded } = db.prepare(`
    SELECT COALESCE(SUM(points), 0) as total FROM transactions WHERE points > 0
  `).get() as { total: number }

  // Active bounties
  const { count: activeBounties } = db.prepare('SELECT COUNT(*) as count FROM bounties WHERE active = 1').get() as { count: number }

  // Recent transactions (last 10)
  const recentTransactions = db.prepare(`
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
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all()

  // Top 5 employees by lifetime points
  const topEmployees = db.prepare(`
    SELECT * FROM employees ORDER BY lifetime_points DESC LIMIT 5
  `).all()

  // Tier distribution
  const employees = db.prepare('SELECT lifetime_points FROM employees').all() as { lifetime_points: number }[]
  const tierCounts: Record<string, { count: number; color: string }> = {
    Bronze: { count: 0, color: 'text-orange-400' },
    Silver: { count: 0, color: 'text-gray-300' },
    Gold: { count: 0, color: 'text-yellow-400' },
    Platinum: { count: 0, color: 'text-purple-400' },
    Diamond: { count: 0, color: 'text-blue-400' },
  }

  employees.forEach((emp) => {
    const { tier, color } = getTier(emp.lifetime_points)
    if (tierCounts[tier]) {
      tierCounts[tier].count++
      tierCounts[tier].color = color
    }
  })

  const tierDistribution = Object.entries(tierCounts).map(([tier, data]) => ({
    tier,
    count: data.count,
    color: data.color,
  }))

  return NextResponse.json({
    totalEmployees,
    totalPointsAwarded,
    activeBounties,
    recentTransactions,
    topEmployees,
    tierDistribution,
  })
}
