'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogoMark, Notice, Spinner, buttonClass, inputClass, labelClass } from '@/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setLoading(true)
      setMessage(null)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: `We sent a sign-in link to ${email}. Open it on this device to continue.`,
      })
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send login link',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-[360px]">
        <LogoMark className="h-8 w-8" />
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-fg">Sign in to FareWatch</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Enter your email and we’ll send you a link. No password needed.
        </p>

        {message && (
          <Notice tone={message.type} className="mt-6">
            {message.text}
          </Notice>
        )}

        <form onSubmit={handleEmailLogin} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <button type="submit" disabled={loading} className={buttonClass('primary', 'md', 'w-full h-10')}>
            {loading && <Spinner className="border-bg/30 border-t-bg" />}
            {loading ? 'Sending link' : 'Send sign-in link'}
          </button>
        </form>

        <p className="mt-8 border-t border-line pt-5 text-[13px] leading-relaxed text-faint">
          By signing in you agree to the{' '}
          <a href="/privacy" className="text-muted underline underline-offset-2 hover:text-fg">
            privacy policy
          </a>
          . Each account can run up to 5 active watches.
        </p>
      </div>
    </div>
  )
}
