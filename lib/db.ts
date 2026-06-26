import Database from 'better-sqlite3'
import path from 'path'
import bcrypt from 'bcryptjs'
export { getTier } from './tiers'

const DB_PATH = path.join(process.cwd(), 'data', 'my10points.db')

// Ensure data directory exists
import fs from 'fs'
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initializeSchema(_db)
  }
  return _db
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      department TEXT,
      current_points INTEGER NOT NULL DEFAULT 0,
      lifetime_points INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      points_value INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'award',
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL,
      available INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bounties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      points_reward INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      deadline TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      category_id INTEGER,
      gift_id INTEGER,
      bounty_id INTEGER,
      points INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      edited_at DATETIME,
      edited_by INTEGER,
      edit_notes TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (gift_id) REFERENCES gifts(id),
      FOREIGN KEY (bounty_id) REFERENCES bounties(id)
    );
  `)

  // Seed default admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@my10points.com')
  if (!adminExists) {
    const passwordHash = bcrypt.hashSync('admin123', 10)
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('Admin', 'admin@my10points.com', passwordHash, 'admin')
  }

  // Seed default categories if none exist
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare(`
      INSERT INTO categories (name, description, points_value, type)
      VALUES (?, ?, ?, ?)
    `)
    insertCategory.run('Excellent Performance', 'Exceptional work quality or going above and beyond', 50, 'award')
    insertCategory.run('Team Collaboration', 'Helping teammates and fostering teamwork', 30, 'award')
    insertCategory.run('Innovation', 'Creative ideas or process improvements', 40, 'award')
    insertCategory.run('Customer Service', 'Outstanding customer satisfaction', 35, 'award')
    insertCategory.run('Attendance Award', 'Perfect attendance for the month', 20, 'award')
    insertCategory.run('Late Submission', 'Submitting work past the deadline', -10, 'deduct')
    insertCategory.run('Policy Violation', 'Minor policy infringement', -20, 'deduct')
  }
}

export default getDb
