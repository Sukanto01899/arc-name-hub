'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useDisconnect } from 'wagmi'
import { ARCNAMES_ADDRESS, ARCNAMES_ABI } from '@/lib/contracts'
import {
  shortenAddress, formatExpiry, getExpiryColor, getDaysUntilExpiry, validateName,
} from '@/lib/domain'
import { useQueryClient } from '@tanstack/react-query'

// Known domain names for this wallet — in a real app you'd scan Transfer events
// We keep a local list synced via localStorage + registration callbacks
function useOwnedDomains(address: `0x${string}` | undefined) {
  const [names, setNames] = useState<string[]>([])

  useEffect(() => {
    if (!address) return
    try {
      const key = `arcnames_domains_${address.toLowerCase()}`
      const stored = localStorage.getItem(key)
      if (stored) setNames(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [address])

  return { names, setNames }
}

interface DomainRowProps {
  name: string
  address: `0x${string}` | undefined
  onSetPrimary: (name: string) => void
  isPrimaryName: boolean
}

function DomainRow({ name, address, onSetPrimary, isPrimaryName }: DomainRowProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: info } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: 'getDomainInfo',
    args: [name],
    query: { enabled: !!name },
  })

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const expiry = info?.expiry ?? BigInt(0)
  const expiryColor = expiry > BigInt(0) ? getExpiryColor(expiry) : 'var(--arc-muted)'
  const expiryLabel = expiry > BigInt(0) ? formatExpiry(expiry) : '—'
  const days = expiry > BigInt(0) ? getDaysUntilExpiry(expiry) : -1

  return (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-xl"
      style={{ background: 'var(--arc-surface2)', border: '1px solid var(--arc-border)' }}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate" style={{ color: 'var(--arc-text)' }}>
            {name}.arc
          </span>
          {isPrimaryName && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
              style={{ background: 'rgba(79,110,247,0.15)', color: 'var(--arc-blue)' }}
            >
              Primary
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: expiryColor }}>
          Expires {expiryLabel}
          {days > 0 && days <= 90 && ` · ${days}d left`}
        </span>
      </div>

      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setShowMenu(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none"
          style={{ color: 'var(--arc-muted)', background: 'var(--arc-surface)' }}
        >
          ···
        </button>
        {showMenu && (
          <div
            className="absolute right-0 top-8 w-40 rounded-xl py-1 z-20 animate-fade-in"
            style={{
              background: 'var(--arc-surface)',
              border: '1px solid var(--arc-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <MenuOption
              label="Set Primary"
              onClick={() => { onSetPrimary(name); setShowMenu(false) }}
              disabled={isPrimaryName}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function MenuOption({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left px-3 py-2 text-sm transition-colors disabled:opacity-40"
      style={{ color: disabled ? 'var(--arc-muted)' : 'var(--arc-text)' }}
      onMouseEnter={e => !disabled && ((e.target as HTMLElement).style.background = 'var(--arc-surface2)')}
      onMouseLeave={e => ((e.target as HTMLElement).style.background = 'transparent')}
    >
      {label}
    </button>
  )
}

function QuickCheck() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 400)
    return () => clearTimeout(t)
  }, [query])

  const validation = validateName(debouncedQuery)
  const enabled = debouncedQuery.length > 0 && validation.valid

  const { data: available, isLoading } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: 'isAvailable',
    args: [debouncedQuery],
    query: { enabled },
  })

  const { data: info } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: 'getDomainInfo',
    args: [debouncedQuery],
    query: { enabled: enabled && available === false },
  })

  const showResult = debouncedQuery.length > 0 && !isLoading

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium" style={{ color: 'var(--arc-muted2)' }}>Quick Check</p>
      <div
        className="flex items-center rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--arc-border)', background: 'var(--arc-surface2)' }}
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value.toLowerCase())}
          placeholder="check a domain..."
          className="flex-1 px-3 py-2 text-sm bg-transparent outline-none"
          style={{ color: 'var(--arc-text)' }}
        />
        {query && (
          <span className="px-2 text-sm flex-shrink-0" style={{ color: 'var(--arc-muted)' }}>
            .arc
          </span>
        )}
      </div>

      {isLoading && debouncedQuery && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--arc-muted)' }}>
          <span className="spinner" style={{ width: 12, height: 12 }} />
          Checking...
        </div>
      )}

      {showResult && !isLoading && available === true && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--arc-green)' }}>●</span>
            <span style={{ color: 'var(--arc-green)' }}>Available</span>
          </div>
          <span style={{ color: 'var(--arc-muted)' }}>{debouncedQuery}.arc</span>
        </div>
      )}

      {showResult && !isLoading && available === false && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--arc-red)' }}>●</span>
            <span style={{ color: 'var(--arc-red)' }}>Taken</span>
          </div>
          {info && (
            <span style={{ color: 'var(--arc-muted)' }}>
              expires {formatExpiry(info.expiry)}
            </span>
          )}
        </div>
      )}

      {debouncedQuery && !validation.valid && (
        <p className="text-xs" style={{ color: 'var(--arc-yellow)' }}>
          {validation.reason}
        </p>
      )}
    </div>
  )
}

interface ProfilePanelProps {
  onClose: () => void
  onRegisterClick?: (name: string) => void
  mode?: 'popover' | 'page'
}

export function ProfilePanel({ onClose, onRegisterClick, mode = 'popover' }: ProfilePanelProps) {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const panelRef = useRef<HTMLDivElement>(null)
  const { names } = useOwnedDomains(address)

  const { data: primaryName, refetch: refetchPrimary } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: 'primaryName',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { writeContract, data: writeData } = useWriteContract()
  const { isSuccess: setPrimarySuccess } = useWaitForTransactionReceipt({ hash: writeData })
  const qc = useQueryClient()

  useEffect(() => {
    if (setPrimarySuccess) {
      refetchPrimary()
      qc.invalidateQueries()
    }
  }, [setPrimarySuccess, refetchPrimary, qc])

  useEffect(() => {
    if (mode === 'page') return

    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [mode, onClose])

  const handleSetPrimary = (name: string) => {
    writeContract({
      address: ARCNAMES_ADDRESS,
      abi: ARCNAMES_ABI,
      functionName: 'setPrimaryName',
      args: [name],
    })
  }

  return (
    <div
      ref={panelRef}
      className={`${mode === 'page' ? 'w-full' : 'w-full sm:w-80'} rounded-[8px] animate-fade-in z-40 overflow-hidden`}
      style={{
        background: 'var(--arc-surface)',
        border: '1px solid var(--arc-border)',
        boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
      }}
    >
      {/* Section 1 — Identity */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--arc-border)' }}>
        <p className="text-xs mb-1" style={{ color: 'var(--arc-muted)' }}>
          {address ? shortenAddress(address) : '—'}
        </p>
        {primaryName ? (
          <p className="truncate text-lg font-bold" style={{ color: 'var(--arc-blue)' }}>
            {primaryName}.arc
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--arc-muted2)' }}>No primary name set</p>
        )}
      </div>

      {/* Section 2 — Your Domains */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--arc-border)' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--arc-muted2)' }}>
          Your Domains
        </p>
        {names.length === 0 ? (
          <div className="flex flex-col items-center py-4 gap-1">
            <span className="text-2xl opacity-40">◎</span>
            <p className="text-sm" style={{ color: 'var(--arc-muted)' }}>No domains yet</p>
          </div>
        ) : (
          <div className={`${mode === 'page' ? 'max-h-[28rem]' : 'max-h-48'} flex flex-col gap-2 overflow-y-auto`}>
            {names.map(name => (
              <DomainRow
                key={name}
                name={name}
                address={address}
                onSetPrimary={handleSetPrimary}
                isPrimaryName={primaryName === name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 3 — Quick Check */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--arc-border)' }}>
        <QuickCheck />
      </div>

      {/* Section 4 — Disconnect */}
      <div className="px-4 py-3">
        <button
          onClick={() => { disconnect(); onClose() }}
          className="text-sm w-full text-left transition-colors"
          style={{ color: 'var(--arc-muted)' }}
          onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--arc-red)')}
          onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--arc-muted)')}
        >
          Disconnect →
        </button>
      </div>
    </div>
  )
}

// Exported helper so page.tsx can register newly registered domains
export function addOwnedDomain(address: string, name: string) {
  if (typeof window === 'undefined') return
  try {
    const key = `arcnames_domains_${address.toLowerCase()}`
    const stored = localStorage.getItem(key)
    const existing: string[] = stored ? JSON.parse(stored) : []
    if (!existing.includes(name)) {
      localStorage.setItem(key, JSON.stringify([name, ...existing]))
    }
  } catch { /* ignore */ }
}
