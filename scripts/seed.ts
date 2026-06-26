import { getDb } from '../lib/db'
import bcrypt from 'bcryptjs'

const db = getDb()

console.log('Seeding database...')

// Seed additional users
const users = [
  { name: 'Manager User', email: 'manager@my10points.com', password: 'manager123', role: 'manager' },
  { name: 'Viewer User', email: 'viewer@my10points.com', password: 'viewer123', role: 'viewer' },
]

for (const user of users) {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email)
  if (!exists) {
    const hash = bcrypt.hashSync(user.password, 10)
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(user.name, user.email, hash, user.role)
    console.log(`Created user: ${user.email}`)
  }
}

// Seed employees
const employees = [
  { name: 'Alice Johnson', email: 'alice@company.com', department: 'Engineering' },
  { name: 'Bob Smith', email: 'bob@company.com', department: 'Sales' },
  { name: 'Carol Davis', email: 'carol@company.com', department: 'Marketing' },
  { name: 'David Wilson', email: 'david@company.com', department: 'Engineering' },
  { name: 'Eva Martinez', email: 'eva@company.com', department: 'HR' },
]

for (const emp of employees) {
  const exists = db.prepare('SELECT id FROM employees WHERE email = ?').get(emp.email)
  if (!exists) {
    db.prepare(`
      INSERT INTO employees (name, email, department)
      VALUES (?, ?, ?)
    `).run(emp.name, emp.email, emp.department)
    console.log(`Created employee: ${emp.name}`)
  }
}

// Seed some gifts
const gifts = [
  { name: 'Coffee Gift Card ($10)', description: 'Redeemable at any coffee shop', points_cost: 200 },
  { name: 'Amazon Gift Card ($25)', description: '$25 Amazon gift card', points_cost: 500 },
  { name: 'Restaurant Voucher', description: '$50 restaurant voucher', points_cost: 1000 },
  { name: 'Day Off', description: 'One extra day off', points_cost: 2000 },
]

const giftCount = db.prepare('SELECT COUNT(*) as count FROM gifts').get() as { count: number }
if (giftCount.count === 0) {
  for (const gift of gifts) {
    db.prepare(`
      INSERT INTO gifts (name, description, points_cost)
      VALUES (?, ?, ?)
    `).run(gift.name, gift.description, gift.points_cost)
    console.log(`Created gift: ${gift.name}`)
  }
}

// Seed some bounties
const bounties = [
  { title: 'Refer a New Client', description: 'Successfully refer a new paying client', points_reward: 200 },
  { title: 'Complete Online Course', description: 'Finish an approved professional development course', points_reward: 150 },
  { title: 'Publish a Blog Post', description: 'Write and publish a company blog post', points_reward: 100 },
]

const bountyCount = db.prepare('SELECT COUNT(*) as count FROM bounties').get() as { count: number }
if (bountyCount.count === 0) {
  for (const bounty of bounties) {
    db.prepare(`
      INSERT INTO bounties (title, description, points_reward)
      VALUES (?, ?, ?)
    `).run(bounty.title, bounty.description, bounty.points_reward)
    console.log(`Created bounty: ${bounty.title}`)
  }
}

console.log('Seeding complete!')
process.exit(0)
