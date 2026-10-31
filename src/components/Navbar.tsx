'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from './ThemeProvider'
import { Plane, Moon, Sun, Plus, ShieldCheck, LogOut } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-slate-900 dark:text-white">
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm shadow-sky-600/30">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <span>Fare<span className="text-sky-600 dark:text-sky-400">Watch</span></span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">India</span>
        </Link>

        {/* Right Nav */}
        <div className="flex items-center gap-2 sm:gap-3">
          {userEmail ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/dashboard'
                    ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Dashboard
              </Link>

              <Link
                href="/watches/new"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Watch</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`text-sm font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                    pathname === '/admin'
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden md:inline">Admin</span>
                </Link>
              )}

              {/* User avatar / Sign out */}
              <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800 gap-2">
                <span className="hidden lg:inline text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                  {userEmail}
                </span>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
              >
                Sign In
              </Link>
            </>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
