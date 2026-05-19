'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ARCNAMES_ADDRESS, ARCNAMES_ABI } from '@/lib/contracts'
import { formatPrice } from '@/lib/domain'
import { arcTestnet } from '@/lib/wagmi'

interface Props {
  name: string
  pricePerYear: bigint
  isConnected: boolean
  onSuccess: () => void
  onClose: () => void
}

const YEAR_OPTIONS = [1, 2, 3, 5] as const

// Native USDC on Arc: no approve step — just send msg.value with register()

export function RegisterModal({ name, pricePerYear, isConnected, onSuccess, onClose }: Props) {
  const [years, setYears] = useState<1 | 2 | 3 | 5>(1)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const chainId = useChainId()
  const isWrongChain = chainId !== arcTestnet.id

  const totalPrice = pricePerYear * BigInt(years)

  const expiryDate = new Date()
  expiryDate.setFullYear(expiryDate.getFullYear() + years)
  const expiryStr = expiryDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const { writeContract, data: txHash, isPending, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isTxSuccess) setSuccess(true)
  }, [isTxSuccess])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleRegister = useCallback(() => {
    setError(null)
    writeContract({
      address: ARCNAMES_ADDRESS,
      abi: ARCNAMES_ABI,
      functionName: 'register',
      args: [name, BigInt(years)],
      value: totalPrice,
    })
  }, [writeContract, name, years, totalPrice])

  const isLoading = isPending || isConfirming

  if (success) {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col items-center text-center py-4 gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: 'rgba(0,229,160,0.12)', border: '2px solid var(--arc-green)' }}
          >
            ✓
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--arc-green)' }}>
              {name}.arc is yours!
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--arc-muted2)' }}>
              Registered for {years} year{years > 1 ? 's' : ''}. Expires {expiryStr}.
            </p>
          </div>
          {txHash && (
            <a
              href={`https://testnet.arcscan.app/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
              style={{ color: 'var(--arc-blue)' }}
            >
              View transaction on ArcScan ↗
            </a>
          )}
          <button
            onClick={onSuccess}
            className="w-full py-3 rounded-xl font-semibold mt-2"
            style={{ background: 'var(--arc-blue)', color: 'white' }}
          >
            Done
          </button>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--arc-text)' }}>
            Register <span style={{ color: 'var(--arc-blue)' }}>{name}.arc</span>
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--arc-muted2)' }}>
            Pay with native USDC on Arc — no approval needed
          </p>
        </div>

        {/* Year selector */}
        <div className="grid grid-cols-4 gap-2">
          {YEAR_OPTIONS.map(y => (
            <button
              key={y}
              onClick={() => setYears(y)}
              className="flex flex-col items-center py-3 px-2 rounded-xl transition-all"
              style={{
                background: years === y ? 'rgba(79,110,247,0.15)' : 'var(--arc-surface2)',
                border: `1px solid ${years === y ? 'var(--arc-blue)' : 'var(--arc-border)'}`,
                color: years === y ? 'var(--arc-blue)' : 'var(--arc-muted2)',
              }}
            >
              <span className="font-semibold text-sm">{y} yr</span>
              <span className="text-xs mt-0.5" style={{ color: 'var(--arc-muted)' }}>
                {formatPrice(pricePerYear * BigInt(y))}
              </span>
            </button>
          ))}
        </div>

        {/* Summary */}
        <div
          className="rounded-xl p-4 flex flex-col gap-2 text-sm"
          style={{ background: 'var(--arc-surface2)', border: '1px solid var(--arc-border)' }}
        >
          <Row label="Domain"   value={`${name}.arc`} />
          <Row label="Duration" value={`${years} year${years > 1 ? 's' : ''}`} />
          <Row label="Expires"  value={expiryStr} />
          <div className="h-px my-1" style={{ background: 'var(--arc-border)' }} />
          <Row label="Total"    value={`${formatPrice(totalPrice)} USDC`} bold />
        </div>

        {error && (
          <div
            className="text-sm px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--arc-red)', border: '1px solid rgba(255,77,106,0.3)' }}
          >
            {error}
          </div>
        )}

        {!isConnected ? (
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        ) : isWrongChain ? (
          <div
            className="text-center text-sm py-3 rounded-xl"
            style={{ background: 'rgba(255,184,0,0.1)', color: 'var(--arc-yellow)', border: '1px solid var(--arc-yellow)' }}
          >
            Switch to Arc Testnet to continue
          </div>
        ) : (
          <button
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ background: 'var(--arc-green)', color: '#08090E' }}
          >
            {isLoading ? (
              <>
                <span className="spinner" style={{ borderTopColor: '#08090E' }} />
                {isConfirming ? 'Registering...' : 'Confirm in wallet...'}
              </>
            ) : (
              `Register for ${formatPrice(totalPrice)} USDC`
            )}
          </button>
        )}
      </div>
    </ModalShell>
  )
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md animate-modal-in relative
                   rounded-t-3xl sm:rounded-2xl
                   p-5 sm:p-6
                   pb-8 sm:pb-6"
        style={{
          background: 'var(--arc-surface)',
          border: '1px solid var(--arc-border)',
          maxHeight: '92svh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div
          className="sm:hidden w-10 h-1 rounded-full mx-auto mb-5"
          style={{ background: 'var(--arc-border)' }}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-lg"
          style={{ color: 'var(--arc-muted)', background: 'var(--arc-surface2)' }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--arc-muted)' }}>{label}</span>
      <span style={{ color: bold ? 'var(--arc-text)' : 'var(--arc-muted2)', fontWeight: bold ? 600 : 400 }}>
        {value}
      </span>
    </div>
  )
}
