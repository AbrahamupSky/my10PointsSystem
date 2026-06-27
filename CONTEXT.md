# My10 Points System — Developer Context

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

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.5 — App Router, TypeScript |
| Database | SQLite via `better-sqlite3` (`data/my10points.db`) |
| Auth | NextAuth v4 — JWT sessions, credentials provider |
| Styling | Tailwind CSS — CFA brand palette, `darkMode: 'media'` |
| Notifications | Sileo — `sileo.action()`, `.success()`, `.error()` |
| Password hashing | bcryptjs |

---

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| Login page | Done | |
| Dashboard — stats + top employees leaderboard | Done | |
| Employees list (search, filter by dept/tier) | Done | |
| Add employee (manual) | Done | |
| Roster CSV import (bulk add with preview) | Done | FOH/BOH color-coded; drag-and-drop + sample download |
| Employee detail + tier progress bar | Done | |
| Categories (award/deduct task types) | Done | |
| Gifts with point costs | Done | |
| Bounties (special opportunities + deadlines) | Done | |
| Transactions — award, deduct, gift exchange, bounty | Done | |
| Debt Forgiveness transaction type | Done | Restores current + lifetime points |
| Lifetime points (never decreases) | Done | |
| Tier system based on lifetime points only | Done | |
| Admin can edit/delete transactions | Done | |
| Role-based access (admin / manager / viewer) | Done | Enforced on both UI and API |
| User management (admin creates accounts) | Done | `/register` page, `/api/users` route |
| Toast notifications (Sileo) | Done | Replaces all browser `confirm()` dialogs |
| Mobile slide-in drawer navigation | Done | Animated; hamburger header on mobile |
| Desktop persistent sidebar | Done | Unchanged from original |
| Admin-only "Users" nav link | Done | Hidden for manager/viewer roles |
| Apple HIG dark mode palette | Done | Exact system color values |
| Auto light/dark (follows OS) | Done | `prefers-color-scheme` only, no manual toggle |
| CFA branding | Done | Logo in sidebar, `#E4002B` red accent |

---

## Role system

| Role | Permissions |
|------|-------------|
| `admin` | Full access — edit/delete transactions, create/manage users, all pages |
| `manager` | Award points, add/import employees, manage categories/gifts/bounties |
| `viewer` | Read-only access to all pages |

Role is stored in JWT + session. API routes check `session.user.role` server-side — the UI hiding buttons is secondary.

---

## Transaction types

| Type | `current_points` | `lifetime_points` | Notes |
|------|-----------------|-------------------|-------|
| `award` | + points | + points | Uses category or custom value |
| `deduct` | − points | no change | Uses category or custom value |
| `gift_exchange` | − cost | no change | Cost pulled from gift record |
| `bounty` | + reward | + reward | Reward pulled from bounty record |
| `forgiveness` | + points | + points | Explicitly restores both; teal badge |

When a transaction is **deleted**, the points effect is fully reversed (including lifetime for `award`, `bounty`, `forgiveness`).

---

## Notifications (Sileo)

`<Toaster position="top-center" theme="system" />` is mounted once in `app/layout.tsx`.

Usage pattern for destructive actions:
```ts
sileo.action({
  title: 'Delete X?',
  description: 'This cannot be undone.',
  duration: null,          // stays until dismissed or button clicked
  button: {
    title: 'Delete',
    onClick: async () => {
      const res = await fetch(...)
      if (res.ok) sileo.success({ title: 'Deleted' })
      else sileo.error({ title: 'Error', description: '...' })
    },
  },
})
```

Files that use Sileo: `employees/page.tsx`, `transactions/page.tsx`, `categories/page.tsx`, `gifts/page.tsx`, `bounties/page.tsx`, `components/ImportModal.tsx`.

---

## Mobile navigation

Replaced bottom tab bar with a **slide-in left drawer**:

- `md:hidden` top header bar: hamburger button (left) + "My10 Points" title (center) + user avatar (right)
- Drawer uses two states to animate correctly without an always-on overlay:
  - `drawerMounted` — controls whether the drawer is in the DOM
  - `drawerVisible` — controls the CSS transition classes (`translate-x-0` vs `-translate-x-full`)
- Open: `setDrawerMounted(true)` → `requestAnimationFrame(() => setDrawerVisible(true))`
- Close: `setDrawerVisible(false)` → `setTimeout(() => setDrawerMounted(false), 300)`
- Backdrop: `opacity-0 → opacity-100` with `duration-300`

Desktop sidebar is unchanged.

---

## Dark mode — Apple HIG colors

`app/globals.css` dark mode block uses exact Apple system color values:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --cfa-surface:   #000000;   /* systemBackground */
    --cfa-card:      #1C1C1E;   /* secondarySystemBackground */
    --cfa-muted:     #2C2C2E;   /* tertiarySystemBackground */
    --cfa-border:    #3A3A3C;   /* opaqueSeparator */
    --cfa-ink:       #FFFFFF;   /* label */
    --cfa-ink-soft:  #8E8E93;   /* systemGray */
    --cfa-ink-dim:   #636366;   /* systemGray2 */
  }
}
```

Light mode retains CFA warm-white/pink palette.

---

## CSV roster import

- **UI:** `components/ImportModal.tsx` — drag-and-drop zone → parse → preview table → confirm
- **API:** `POST /api/employees/import` — bulk insert in a single SQLite transaction; returns `{ imported, skipped }`
- **Parser:** client-side, handles quoted fields, flexible headers (`name`/`full name`/`employee name`, `dept`/`department`, `email`/`email address`)
- **Required column:** `Name`. `Email` and `Department` are optional.
- **Sample CSV** is downloadable from the dialog

---

## User management

- **Page:** `app/register/page.tsx` — admin-only; redirects non-admins to `/`
- **API:** `GET /api/users` (list, admin only) + `POST /api/users` (create, admin only)
- **Nav:** "Users" link appears under an "Admin" section in the sidebar/drawer, only when `role === 'admin'`
- **Roles available on create:** `viewer`, `manager`, `admin`
- Password minimum: 6 characters; hashed with bcrypt (cost 10)

---

## Project structure

```
My10PointsApp/
├── app/
│   ├── page.tsx                      # Dashboard
│   ├── layout.tsx                    # Root layout + <Toaster>
│   ├── globals.css                   # CSS variables + Apple dark mode
│   ├── login/page.tsx
│   ├── register/page.tsx             # Admin-only user management
│   ├── employees/
│   │   ├── page.tsx                  # List + "Import Roster" button
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── categories/page.tsx
│   ├── gifts/page.tsx
│   ├── bounties/page.tsx
│   ├── transactions/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── dashboard/route.ts
│       ├── users/route.ts            # GET + POST (admin only)
│       ├── employees/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── import/route.ts       # Bulk CSV insert
│       ├── categories/route.ts + [id]/route.ts
│       ├── gifts/route.ts + [id]/route.ts
│       ├── bounties/route.ts + [id]/route.ts
│       └── transactions/route.ts + [id]/route.ts
├── components/
│   ├── Navigation.tsx                # Desktop sidebar + mobile drawer
│   ├── TierBadge.tsx
│   ├── PointsModal.tsx               # award/deduct/forgiveness/gift/bounty
│   ├── ImportModal.tsx               # CSV import with drag-and-drop preview
│   └── SessionProviderWrapper.tsx
├── lib/
│   ├── db.ts                         # SQLite init + schema (SERVER ONLY)
│   ├── tiers.ts                      # getTier() — safe for client components
│   ├── auth.ts                       # NextAuth config (role in JWT + session)
│   └── types.ts
├── middleware.ts                     # Protects all routes except /login + /api/auth
├── tailwind.config.ts                # darkMode: 'media', cfa-* tokens
├── public/cfa-logo.png
└── data/my10points.db                # Auto-created on first run
```

---

## Key architecture notes

- `lib/db.ts` is **server-only** — never import in `'use client'` files
- `lib/tiers.ts` is a pure function — safe to import in client components
- All points mutations are wrapped in a `db.transaction()` — atomic, no partial updates
- Session carries `id` and `role` via NextAuth JWT callbacks in `lib/auth.ts`
- API routes always check `getServerSession(authOptions)` before touching the DB
- `middleware.ts` protects all routes except `/login` and `/api/auth/**`

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

## Possible next steps

- Edit or delete existing user accounts (currently only creation is supported)
- Export transactions to CSV
- Email notifications when points are awarded
- Employee self-service portal (view own points/history)
- Charts/analytics on the dashboard (point trends over time)
- Password change functionality
- Profile pictures for employees
- Multi-language support
