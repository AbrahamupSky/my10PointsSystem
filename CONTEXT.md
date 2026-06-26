# My10 Points System — Session Context

## What was built

A full-stack Next.js 14 (App Router) employee points/rewards system, built from scratch in `/home/abrahamup/dev/My10PointsApp`. The app compiles cleanly and is ready to run.

## How to start

```bash
cd /home/abrahamup/dev/My10PointsApp
npm run dev
```

Visit `http://localhost:3000` and log in with:
- **Email:** admin@my10points.com
- **Password:** admin123

The SQLite database is auto-created at `data/my10points.db` on first run.

---

## Tech stack

- **Next.js 14.2.5** — App Router, TypeScript
- **SQLite** via `better-sqlite3` (database at `data/my10points.db`)
- **NextAuth v4** — JWT sessions, credentials provider
- **Tailwind CSS** — CFA branding, `darkMode: 'media'` (follows system/iOS theme automatically)
- **bcryptjs** — password hashing

---

## Features implemented

| Feature | Status |
|---------|--------|
| Login page | Done |
| Dashboard with stats + top employees | Done |
| Employees list (search, filter by dept/tier) | Done |
| Add employee | Done |
| Employee detail + tier progress bar | Done |
| Categories (award/deduct task types, editable) | Done |
| Gifts with point costs (add/edit/toggle) | Done |
| Bounties (special point opportunities + deadlines) | Done |
| Transactions logbook (award, deduct, gift exchange, bounty) | Done |
| Lifetime points system (never decreases) | Done |
| Tier based on lifetime points (not current) | Done |
| Admin can edit/delete transaction log | Done |
| Role-based access (admin / manager / viewer) | Done |
| Mobile-friendly (bottom nav on mobile) | Done |
| CFA branding (Chick-fil-A red `#E4002B`, warm white/maroon palette) | Done |
| Auto light/dark mode (follows iOS/system `prefers-color-scheme`) | Done |
| CFA logo in sidebar + favicon (`public/cfa-logo.png` / `app/icon.png`) | Done |

---

## Role system

| Role | Permissions |
|------|-------------|
| `admin` | Full access — can edit/delete transactions, manage users |
| `manager` | Can award points, add employees, manage categories/gifts/bounties |
| `viewer` | Read-only access to all pages |

---

## Tier thresholds (based on lifetime points only)

| Tier | Lifetime Points |
|------|----------------|
| Bronze | 0 – 999 |
| Silver | 1,000 – 2,999 |
| Gold | 3,000 – 5,999 |
| Platinum | 6,000 – 9,999 |
| Diamond | 10,000+ |

Lifetime points **never decrease** — gift exchanges and deductions only reduce `current_points`.

---

## Project structure

```
My10PointsApp/
├── app/
│   ├── page.tsx                  # Dashboard
│   ├── layout.tsx                # Root layout + nav
│   ├── login/page.tsx
│   ├── employees/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── categories/page.tsx
│   ├── gifts/page.tsx
│   ├── bounties/page.tsx
│   ├── transactions/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── dashboard/route.ts
│       ├── employees/route.ts + [id]/route.ts
│       ├── categories/route.ts + [id]/route.ts
│       ├── gifts/route.ts + [id]/route.ts
│       ├── bounties/route.ts + [id]/route.ts
│       └── transactions/route.ts + [id]/route.ts
├── components/
│   ├── Navigation.tsx            # Sidebar (desktop) + bottom nav (mobile), CFA logo
│   ├── TierBadge.tsx
│   ├── PointsModal.tsx           # Award/deduct/gift/bounty modal
│   ├── ThemeProvider.tsx         # Passthrough only (theme handled by CSS media query)
│   ├── ThemeToggle.tsx           # Returns null (no manual toggle needed)
│   └── SessionProviderWrapper.tsx
├── lib/
│   ├── db.ts                     # SQLite init + schema (SERVER ONLY)
│   ├── tiers.ts                  # getTier() pure function (safe for client)
│   ├── auth.ts                   # NextAuth config
│   └── types.ts
├── middleware.ts                 # Protects all routes except /login
├── .env.local                    # NEXTAUTH_SECRET + NEXTAUTH_URL
├── public/cfa-logo.png           # Real CFA logo (700×394px), used in sidebar
├── app/icon.png                  # Same image, used as browser favicon (Next.js auto-favicon)
├── app/globals.css               # CSS variables for CFA palette + prefers-color-scheme dark
└── data/my10points.db            # Auto-created on first run
```

---

## Key architecture notes

- `lib/tiers.ts` contains the pure `getTier()` function — safe to import in client components
- `lib/db.ts` is **server-only** (imports `better-sqlite3`) — never import in `'use client'` files
- The database is initialized and seeded (admin user + 7 default categories) automatically on first API call
- Transactions are atomic — points update and transaction insert happen in a single SQLite transaction

---

## Theming

- **Color palette**: Chick-fil-A brand red `#E4002B`, warm white/pinks (light), deep maroons (dark)
- **Strategy**: `darkMode: 'media'` in `tailwind.config.ts` — pure CSS, no JS class toggling
- **CSS variables** in `app/globals.css`: `--cfa-surface`, `--cfa-card`, `--cfa-muted`, `--cfa-border`, `--cfa-ink`, `--cfa-ink-soft`, `--cfa-ink-dim` — all swap automatically via `@media (prefers-color-scheme: dark)`
- **Tailwind tokens**: `cfa-red`, `cfa-surface`, `cfa-card`, etc. — reference the CSS variables
- **No manual toggle** — app follows iPhone/system appearance setting automatically

---

## Database schema

```sql
users (id, name, email, password_hash, role, created_at)
employees (id, name, email, department, current_points, lifetime_points, created_at)
categories (id, name, description, points_value, type, active, created_at)
gifts (id, name, description, points_cost, available, created_at)
bounties (id, title, description, points_reward, active, deadline, created_at)
transactions (id, employee_id, type, category_id, gift_id, bounty_id, points, notes,
              created_at, created_by, edited_at, edited_by, edit_notes)
```

---

## Possible next steps (not yet implemented)

- User management page (add/edit/delete users, change roles)
- Export transactions to CSV
- Email notifications when points are awarded
- Employee self-service portal (view own points/history)
- Charts/analytics on the dashboard (point trends over time)
- Multi-language support (app was originally described in Spanish)
- Password change functionality
- Profile picture support for employees
