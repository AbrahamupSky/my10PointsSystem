# My10 Points System

A full-stack employee points and rewards management system built with Next.js 14. Track employee achievements, award/deduct points, manage gift redemptions, and run time-limited bounty challenges — all with role-based access control and a Chick-fil-A branded UI.

---

## Features

- **Dashboard** — live stats and top employee leaderboard
- **Employees** — searchable list with department/tier filtering, individual profile pages with tier progress bars
- **Points transactions** — award, deduct, gift exchange, and bounty redemption, all logged atomically
- **Categories** — customizable award/deduction task types with point values
- **Gifts** — redeemable rewards with point costs (add, edit, toggle availability)
- **Bounties** — special point opportunities with deadlines
- **Transaction log** — full history; admins can edit or delete entries
- **Lifetime points** — never decrease regardless of deductions or gift exchanges; tier is based on lifetime points only
- **Role-based access** — admin / manager / viewer permissions
- **Mobile-friendly** — bottom navigation bar on mobile, sidebar on desktop
- **Auto light/dark mode** — follows system/iOS appearance setting automatically (no manual toggle)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.5 (App Router, TypeScript) |
| Database | SQLite via `better-sqlite3` |
| Auth | NextAuth v4 — JWT sessions, credentials provider |
| Styling | Tailwind CSS with CFA brand palette |
| Password hashing | bcryptjs |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/AbrahamupSky/My10PointsApp.git
cd My10PointsApp
npm install
```

### Environment setup

Create a `.env.local` file in the project root:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The SQLite database is created automatically at `data/my10points.db` on first run, seeded with an admin user and 7 default categories.

### Default login

| Field | Value |
|-------|-------|
| Email | admin@my10points.com |
| Password | admin123 |

> Change this password after your first login.

---

## Role Permissions

| Role | What they can do |
|------|-----------------|
| `admin` | Full access — edit/delete transactions, manage all data and users |
| `manager` | Award points, add employees, manage categories, gifts, and bounties |
| `viewer` | Read-only access to all pages |

---

## Tier System

Tiers are calculated from **lifetime points only** — deductions and gift exchanges never lower an employee's tier.

| Tier | Lifetime Points Required |
|------|--------------------------|
| Bronze | 0 – 999 |
| Silver | 1,000 – 2,999 |
| Gold | 3,000 – 5,999 |
| Platinum | 6,000 – 9,999 |
| Diamond | 10,000+ |

---

## How to Use

### Awarding points

1. Go to **Employees** and open an employee's profile.
2. Click **Award Points**, select a category, add optional notes, and confirm.
3. The transaction is logged and the employee's points update instantly.

### Redeeming a gift

1. Open an employee's profile and click **Redeem Gift**.
2. Select a gift from the list — only affordable gifts are shown.
3. The gift cost is deducted from `current_points` (lifetime points are unaffected).

### Running a bounty

1. Go to **Bounties** and create a new bounty with a point reward and deadline.
2. From any employee profile, click **Bounty** to award the bounty reward to that employee.

### Managing categories

Go to **Categories** to add, edit, or deactivate award and deduction types. Each category has a default point value that pre-fills the award modal.

---

## Project Structure

```
My10PointsApp/
├── app/
│   ├── page.tsx                  # Dashboard
│   ├── layout.tsx                # Root layout + navigation
│   ├── login/page.tsx
│   ├── employees/
│   │   ├── page.tsx              # Employee list
│   │   ├── new/page.tsx          # Add employee
│   │   └── [id]/page.tsx         # Employee detail
│   ├── categories/page.tsx
│   ├── gifts/page.tsx
│   ├── bounties/page.tsx
│   ├── transactions/page.tsx
│   └── api/                      # REST API routes
├── components/
│   ├── Navigation.tsx            # Sidebar + mobile bottom nav
│   ├── TierBadge.tsx
│   ├── PointsModal.tsx           # Award/deduct/gift/bounty modal
│   └── SessionProviderWrapper.tsx
├── lib/
│   ├── db.ts                     # SQLite init + schema (server only)
│   ├── tiers.ts                  # getTier() — safe for client components
│   ├── auth.ts                   # NextAuth config
│   └── types.ts
├── middleware.ts                 # Route protection (all routes except /login)
├── public/cfa-logo.png
└── data/my10points.db            # Auto-created on first run
```

---

## Database Schema

```sql
users        (id, name, email, password_hash, role, created_at)
employees    (id, name, email, department, current_points, lifetime_points, created_at)
categories   (id, name, description, points_value, type, active, created_at)
gifts        (id, name, description, points_cost, available, created_at)
bounties     (id, title, description, points_reward, active, deadline, created_at)
transactions (id, employee_id, type, category_id, gift_id, bounty_id, points, notes,
              created_at, created_by, edited_at, edited_by, edit_notes)
```

---

## Roadmap

- [ ] User management page (add/edit/delete users, change roles)
- [ ] Export transactions to CSV
- [ ] Email notifications when points are awarded
- [ ] Employee self-service portal
- [ ] Dashboard charts and analytics
- [ ] Password change functionality
- [ ] Profile pictures for employees
