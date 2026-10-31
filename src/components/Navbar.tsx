'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from './ThemeProvider'
import { LogoMark, buttonClass, iconButtonClass } from './ui'
import { cn } from '@/lib/utils'
import { Moon, Sun, Plus, LogOut } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleTheme } = useTheme()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
        // Check admin from API or user metadata
        fetch('/api/admin/stats')
          .then((res) => {
            if (res.ok) setIsAdmin(true)
          })
          .catch(() => {})
      }
    }
    loadUser()
  }, [pathname, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserEmail(null)
    setIsAdmin(false)
    router.push('/login')
    router.refresh()
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={pathname === href ? 'page' : undefined}
      className={cn(
        'h-8 inline-flex items-center rounded-md px-2.5 text-[13px] font-medium transition-colors',
        pathname === href ? 'text-fg bg-subtle' : 'text-muted hover:text-fg'
      )}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href={userEmail ? '/dashboard' : '/'} className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-fg">
            <LogoMark />
            <span>FareWatch</span>
          </Link>

          {userEmail && (
            <nav className="hidden sm:flex items-center gap-1">
              {navLink('/dashboard', 'Watches')}
              {isAdmin && navLink('/admin', 'Admin')}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {userEmail ? (
            <>
              <nav className="flex sm:hidden items-center gap-1 mr-1">
                {navLink('/dashboard', 'Watches')}
                {isAdmin && navLink('/admin', 'Admin')}
              </nav>
              <Link href="/watches/new" className={buttonClass('primary', 'sm', 'hidden sm:inline-flex')}>
                <Plus className="h-3.5 w-3.5" />
                New watch
              </Link>
              <span className="hidden lg:inline pl-3 text-[13px] text-muted truncate max-w-[180px]">{userEmail}</span>
              <button onClick={handleSignOut} title="Sign out" aria-label="Sign out" className={iconButtonClass}>
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            pathname !== '/login' && (
              <Link href="/login" className={buttonClass('secondary', 'sm')}>
                Sign in
              </Link>
            )
          )}

          <button onClick={toggleTheme} aria-label="Toggle color theme" className={iconButtonClass}>
            {/* Icon follows the .dark class so it never mismatches during hydration */}
            <Sun className="hidden h-4 w-4 dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </button>
        </div>
      </div>
    </header>
  )
}
