import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Navigation from '@/components/Navigation'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'

export const metadata: Metadata = {
  title: 'My10 Points System',
  description: 'Employee rewards and points management system',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className="bg-cfa-surface text-cfa-ink min-h-screen">
        <SessionProviderWrapper session={session}>
          {session ? (
            <div className="flex min-h-screen">
              <Navigation session={session} />
              <main className="flex-1 md:ml-64 pb-20 md:pb-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                  {children}
                </div>
              </main>
            </div>
          ) : (
            <main className="min-h-screen">{children}</main>
          )}
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
