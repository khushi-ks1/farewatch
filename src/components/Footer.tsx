import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>FareWatch tracks domestic fares in India. Always confirm the final price before booking.</p>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="hover:text-fg transition-colors">
            Privacy
          </Link>
          <a
            href="https://github.com/khushi-ks1/farewatch"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fg transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
