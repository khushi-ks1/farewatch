import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'FareWatch | Flight price alerts for India',
  description: 'Track domestic flight fares in India and get email alerts when live prices match your target.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col transition-colors">
        <ThemeProvider>
          <Suspense fallback={<div className="h-16 w-full border-b border-slate-200 dark:border-slate-800" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
