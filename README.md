# My10 Points System

A full-stack employee points and rewards management system built with Next.js 14. Track employee achievements, award/deduct points, manage gift redemptions, run time-limited bounty challenges, and forgive debts — all with role-based access control and a Chick-fil-A branded UI.

---

## Features

- **Dashboard** — live stats and top employee leaderboard
- **Employees** — searchable list with department/tier filtering, individual profile pages with tier progress bars
- **Points transactions** — award, deduct, gift exchange, bounty redemption, and debt forgiveness, all logged atomically
- **Debt Forgiveness** — reverse a penalty by forgiving points; restores both current *and* lifetime points so the employee's tier is also rewarded
- **Categories** — customizable award/deduction task types with point values
- **Gifts** — redeemable rewards with point costs (add, edit, toggle availability)
- **Bounties** — special point opportunities with deadlines
- **Transaction log** — full history; admins can edit notes or delete entries
- **Roster CSV import** — bulk-import employees from a `.csv` file with drag-and-drop preview; supports FOH/BOH departments
- **User management** — admins can create new user accounts (viewer / manager / admin roles) from the Users page
- **Toast notifications** — all destructive actions use Sileo action toasts (no browser `confirm()` dialogs)
- **Lifetime points** — never decrease regardless of deductions or gift exchanges; tier is based on lifetime points only
- **Role-based access** — admin / manager / viewer permissions enforced on both UI and API
- **Mobile-friendly** — slide-in left drawer navigation on mobile, persistent sidebar on desktop
- **Auto dark mode** — follows Apple HIG system colors (`systemBackground`, `secondarySystemBackground`, etc.) via `prefers-color-scheme`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.5 (App Router, TypeScript) |
| Database | SQLite via `better-sqlite3` |
| Auth | NextAuth v4 — JWT sessions, credentials provider |
| Styling | Tailwind CSS with CFA brand palette |
| Notifications | Sileo — physics-based toast component |
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
| `admin` | Full access — edit/delete transactions, manage all data, create/manage users |
| `manager` | Award points, add employees, import rosters, manage categories, gifts, and bounties |
| `viewer` | Read-only access to all pages |

---

## Tier System

Tiers are calculated from **lifetime points only** — deductions and gift exchanges never lower an employee's tier. Debt forgiveness *does* increase lifetime points, rewarding the employee for earning back good standing.

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

1. Open an employee's profile and click **Award Points → Gift**.
2. Select a gift from the list.
3. The gift cost is deducted from `current_points` (lifetime points are unaffected).

### Running a bounty

1. Go to **Bounties** and create a new bounty with a point reward and deadline.
2. From any New Transaction modal, select **Bounty** and pick the bounty to award it.

### Forgiving a debt

1. Open **New Transaction** (from any employee or the Transactions page).
2. Select the **Forgive** tab.
3. Enter the number of points to forgive and add a note explaining the reason.
4. Confirm — the points are restored to `current_points` **and** added to `lifetime_points`.

### Importing a roster

1. Go to **Employees** and click **Import Roster**.
2. Drag and drop a `.csv` file or click to browse.
3. Review the preview table (FOH/BOH color-coded), then click **Import**.

Expected CSV format:

```csv
Name,Email,Department
John Smith,john@example.com,FOH
Jane Doe,,BOH
```

A sample file is available to download directly from the import dialog.

### Managing categories

Go to **Categories** to add, edit, or deactivate award and deduction types. Each category has a default point value that pre-fills the transaction modal.

### Adding users (admin only)

Go to **Users** (visible only to admins in the sidebar) to create new accounts and assign roles.

---

## Project Structure

```
My10PointsApp/
├── app/
│   ├── page.tsx                      # Dashboard
│   ├── layout.tsx                    # Root layout + Toaster
│   ├── login/page.tsx
│   ├── register/page.tsx             # Admin-only user management
│   ├── employees/
│   │   ├── page.tsx                  # Employee list + Import Roster button
│   │   ├── new/page.tsx              # Add employee
│   │   └── [id]/page.tsx             # Employee detail
│   ├── categories/page.tsx
│   ├── gifts/page.tsx
│   ├── bounties/page.tsx
│   ├── transactions/page.tsx
│   └── api/
│       ├── users/route.ts            # GET/POST users (admin only)
│       ├── employees/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── import/route.ts       # Bulk CSV import
│       ├── categories/route.ts + [id]/route.ts
│       ├── gifts/route.ts + [id]/route.ts
│       ├── bounties/route.ts + [id]/route.ts
│       └── transactions/route.ts + [id]/route.ts
├── components/
│   ├── Navigation.tsx                # Sidebar (desktop) + drawer (mobile)
│   ├── TierBadge.tsx
│   ├── PointsModal.tsx               # Award/deduct/forgive/gift/bounty modal
│   ├── ImportModal.tsx               # CSV roster import with preview
│   └── SessionProviderWrapper.tsx
├── lib/
│   ├── db.ts                         # SQLite init + schema (server only)
│   ├── tiers.ts                      # getTier() — safe for client components
│   ├── auth.ts                       # NextAuth config
│   └── types.ts
├── middleware.ts                     # Route protection (all routes except /login)
├── public/cfa-logo.png
└── data/my10points.db                # Auto-created on first run
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

### Transaction types

| Type | Effect on `current_points` | Effect on `lifetime_points` |
|------|----------------------------|-----------------------------|
| `award` | + points | + points |
| `deduct` | − points | no change |
| `gift_exchange` | − cost | no change |
| `bounty` | + reward | + reward |
| `forgiveness` | + points | + points |

---

## Roadmap

- [x] User management page (create users, assign roles)
- [ ] Edit/delete users
- [ ] Export transactions to CSV
- [ ] Email notifications when points are awarded
- [ ] Employee self-service portal
- [ ] Dashboard charts and analytics
- [ ] Password change functionality
- [ ] Profile pictures for employees
