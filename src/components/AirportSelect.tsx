'use client'

import React, { useState, useRef, useEffect, useId } from 'react'
import { Airport, searchAirports, INDIAN_AIRPORTS } from '@/lib/airports'
import { ChevronsUpDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { labelClass } from './ui'

interface AirportSelectProps {
  label: string
  value: string // airport code, e.g. 'BLR'
  onChange: (airport: Airport) => void
  excludeCode?: string
}

export function AirportSelect({ label, value, onChange, excludeCode }: AirportSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const selectedAirport = INDIAN_AIRPORTS.find((a) => a.code === value)
  const filtered = searchAirports(query).filter((a) => a.code !== excludeCode)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <span id={`${id}-label`} className={labelClass}>
        {label}
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
        onClick={() => {
          setIsOpen(!isOpen)
          setQuery('')
        }}
        className={cn(
          'flex h-12 w-full items-center justify-between gap-3 rounded-md border bg-surface px-3 text-left transition-colors focus:outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent-soft',
          isOpen ? 'border-accent ring-3 ring-accent-soft' : 'border-line-strong hover:border-faint'
        )}
      >
        {selectedAirport ? (
          <span className="flex min-w-0 items-center gap-3">
            <span className="w-9 shrink-0 text-[15px] font-semibold tabular-nums tracking-[-0.01em] text-fg">
              {selectedAirport.code}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-fg">{selectedAirport.city}</span>
              <span className="block truncate text-xs text-muted">{selectedAirport.name}</span>
            </span>
          </span>
        ) : (
          <span className="text-sm text-faint">Choose an airport</span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-faint" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 flex max-h-80 flex-col overflow-hidden rounded-lg border border-line-strong bg-surface shadow-[0_16px_40px_-12px_rgb(0_0_0/0.25)]">
          <div className="relative border-b border-line">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="City or code, e.g. Delhi or BLR"
              aria-label={`Search ${label.toLowerCase()} airports`}
              className="h-10 w-full bg-transparent pl-9 pr-9 text-sm text-fg placeholder:text-faint focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-faint hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <ul role="listbox" aria-labelledby={`${id}-label`} className="overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-[13px] text-muted">
                No Indian airports match &ldquo;{query}&rdquo;
              </li>
            ) : (
              filtered.map((airport) => (
                <li key={airport.code} role="option" aria-selected={airport.code === value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(airport)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-subtle',
                      airport.code === value && 'bg-accent-soft'
                    )}
                  >
                    <span className="w-9 shrink-0 text-[13px] font-semibold tabular-nums text-fg">{airport.code}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-fg">
                        {airport.city} <span className="text-faint">{airport.state}</span>
                      </span>
                      <span className="block truncate text-xs text-muted">{airport.name}</span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
