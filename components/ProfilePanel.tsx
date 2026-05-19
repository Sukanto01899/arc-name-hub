'use client'

import { useEffect, useRef } from 'react'
import { useAccount, useReadContract, useDisconnect } from 'wagmi'
import Link from 'next/link'
import { ARCNAMES_ADDRESS, ARCNAMES_ABI } from '@/lib/contracts'
import { shortenAddress } from '@/lib/domain'

interface ProfilePanelProps {
  onClose: () => void
}

export function ProfilePanel({ onClose }: ProfilePanelProps) {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const panelRef = useRef<HTMLDivElement>(null)

  const { data: primaryName } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: 'primaryName',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [onClose])

  const initial = primaryName
    ? primaryName.charAt(0).toUpperCase()
    : address
      ? address.slice(2, 3).toUpperCase()
      : '?'

  return (
    <div
      ref={panelRef}
      className="w-full sm:w-68 rounded-2xl animate-fade-in overflow-hidden"
      style={{
        background: 'rgba(6, 18, 44, 0.97)',
        border: '1px solid rgba(219,205,169,0.2)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(219,205,169,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Identity */}
      <div
        className="px-4 py-4"
        style={{
          background: 'linear-gradient(135deg, rgba(41,88,130,0.45) 0%, rgba(19,50,80,0.15) 100%)',
          borderBottom: '1px solid rgba(219,205,169,0.12)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center font-bold text-base select-none"
            style={{
              background: 'linear-gradient(135deg, var(--arc-surface2), var(--arc-mid))',
              color: 'var(--arc-cream)',
              border: '1.5px solid rgba(219,205,169,0.25)',
            }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            {primaryName ? (
              <p className="font-bold truncate text-sm" style={{ color: 'var(--arc-text)' }}>
                {primaryName}.arc
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--arc-muted2)' }}>No primary name</p>
            )}
            <p className="text-xs mt-0.5" style={{ color: 'var(--arc-muted)' }}>
              {address ? shortenAddress(address) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Manage Names link */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(219,205,169,0.1)' }}>
        <Link
          href="/manage-name"
          onClick={onClose}
          className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
          style={{
            background: 'rgba(41,88,130,0.35)',
            color: 'var(--arc-text)',
            border: '1px solid rgba(219,205,169,0.1)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(41,88,130,0.55)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(41,88,130,0.35)'
          }}
        >
          <span>Manage Names</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--arc-muted)' }}
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Disconnect */}
      <div className="px-4 py-3">
        <button
          onClick={() => { disconnect(); onClose() }}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{
            background: 'rgba(255,77,106,0.08)',
            color: 'var(--arc-red)',
            border: '1px solid rgba(255,77,106,0.18)',
          }}
          onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,77,106,0.18)') }}
          onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(255,77,106,0.08)') }}
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

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
