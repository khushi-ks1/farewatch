import Link from 'next/link'
import { Plane, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-sm text-slate-500 dark:text-slate-400">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">FareWatch</span>
          <span>&bull; Flight Price Alerts for India</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <a
            href="https://github.com/khushi-ks1/farewatch"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            GitHub
          </a>
          <span className="text-xs flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> in India
          </span>
        </div>
      </div>
    </footer>
  )
}
