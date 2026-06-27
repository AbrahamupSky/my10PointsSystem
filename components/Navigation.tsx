'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'

interface NavigationProps {
  session: Session | null
}

const navLinks = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/employees',
    label: 'Employees',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/categories',
    label: 'Categories',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    href: '/gifts',
    label: 'Gifts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
  {
    href: '/bounties',
    label: 'Bounties',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    href: '/transactions',
    label: 'Transactions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
]

const adminNavLinks = [
  {
    href: '/register',
    label: 'Users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
]

export default function Navigation({ session }: NavigationProps) {
  const pathname = usePathname()
  const [drawerMounted, setDrawerMounted] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)

  const user = session?.user as { name?: string | null; email?: string | null; role?: string } | undefined
  const isAdmin = user?.role === 'admin'

  function openDrawer() {
    setDrawerMounted(true)
    requestAnimationFrame(() => setDrawerVisible(true))
  }

  function closeDrawer() {
    setDrawerVisible(false)
    setTimeout(() => setDrawerMounted(false), 300)
  }

  const desktopAndDrawerLinks = (
    <>
      {navLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeDrawer}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-cfa-red text-white'
                : 'text-cfa-ink-soft hover:text-cfa-ink hover:bg-cfa-muted'
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        )
      })}

      {isAdmin && (
        <>
          <div className="pt-3 pb-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-cfa-ink-dim">Admin</p>
          </div>
          {adminNavLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeDrawer}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cfa-red text-white'
                    : 'text-cfa-ink-soft hover:text-cfa-ink hover:bg-cfa-muted'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            )
          })}
        </>
      )}
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-cfa-card border-r border-cfa-border">
        <div className="flex items-center justify-center px-6 py-4 border-b border-cfa-border">
          <Image src="/cfa-logo.png" alt="Chick-fil-A" width={160} height={90} className="object-contain" priority />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {desktopAndDrawerLinks}
        </nav>

        <div className="px-4 py-4 border-t border-cfa-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-cfa-red flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cfa-ink text-sm font-medium truncate">{user?.name}</p>
              <p className="text-cfa-ink-soft text-xs truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-cfa-ink-soft hover:text-cfa-red hover:bg-cfa-red/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-cfa-card border-b border-cfa-border h-14 flex items-center justify-between px-4">
        <button
          onClick={openDrawer}
          className="p-2 -ml-2 text-cfa-ink-soft hover:text-cfa-ink transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="text-cfa-ink font-bold text-base tracking-tight">My10 Points</span>

        <div className="w-8 h-8 rounded-full bg-cfa-red flex items-center justify-center">
          <span className="text-white font-semibold text-sm">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerMounted && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
          />

          {/* Drawer panel */}
          <div className={`relative w-72 max-w-[85vw] bg-cfa-card h-full flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${drawerVisible ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* User info */}
            <div className="px-6 pt-10 pb-6 border-b border-cfa-border">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-cfa-red flex items-center justify-center flex-shrink-0 shadow-lg shadow-cfa-red/30">
                  <span className="text-white font-bold text-xl">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-cfa-ink font-bold text-base truncate">{user?.name}</p>
                  <p className="text-cfa-ink-soft text-sm capitalize">{user?.role}</p>
                </div>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
              {desktopAndDrawerLinks}
            </nav>

            {/* Sign out */}
            <div className="px-4 py-5 border-t border-cfa-border">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cfa-ink-soft hover:text-cfa-red hover:bg-cfa-red/10 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
