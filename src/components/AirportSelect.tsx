'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Airport, searchAirports, INDIAN_AIRPORTS } from '@/lib/airports'
import { Plane, Search, X } from 'lucide-react'

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

  const selectedAirport = INDIAN_AIRPORTS.find((a) => a.code === value)
  const filtered = searchAirports(query).filter((a) => a.code !== excludeCode)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        {label}
      </label>

      {/* Button to open dropdown */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          setQuery('')
        }}
        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-left transition-colors hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        {selectedAirport ? (
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold text-sm tracking-wide">
              {selectedAirport.code}
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedAirport.city}
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[200px]">
                {selectedAirport.name}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Plane className="w-4 h-4" />
            <span>Select Indian airport...</span>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 max-h-72 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative mb-2 px-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by city or code (e.g. BLR, Delhi)..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-750">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No Indian airports found matching &quot;{query}&quot;
              </div>
            ) : (
              filtered.map((airport) => (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => {
                    onChange(airport)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    airport.code === value ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{airport.city}</span>
                      <span className="text-[10px] font-normal text-slate-400">({airport.state})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                      {airport.name}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs">
                    {airport.code}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
