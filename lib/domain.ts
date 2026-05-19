export function formatExpiry(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function getDaysUntilExpiry(timestamp: bigint): number {
  const now = Math.floor(Date.now() / 1000)
  const diff = Number(timestamp) - now
  return Math.floor(diff / 86400)
}

export function getExpiryColor(timestamp: bigint): string {
  const days = getDaysUntilExpiry(timestamp)
  if (days > 90) return 'var(--arc-green)'
  if (days >= 30) return 'var(--arc-yellow)'
  return 'var(--arc-red)'
}

// Arc native USDC = 18 decimals (1e18 = $1.00)
export function formatPrice(priceWei: bigint): string {
  const usd = Number(priceWei) / 1e18
  if (usd < 1) return `$${usd.toFixed(2)}`       // $0.10
  if (Number.isInteger(usd)) return `$${usd}`     // $2, $10, $100
  return `$${usd.toFixed(2)}`
}

export function validateName(name: string): { valid: boolean; reason?: string } {
  if (!name || name.length === 0) return { valid: false, reason: 'Name cannot be empty' }
  if (name.length > 32) return { valid: false, reason: 'Name cannot exceed 32 characters' }
  if (name.startsWith('-')) return { valid: false, reason: 'Name cannot start with a hyphen' }
  if (name.endsWith('-')) return { valid: false, reason: 'Name cannot end with a hyphen' }

  for (const ch of name) {
    const code = ch.charCodeAt(0)
    const isLower = code >= 97 && code <= 122
    const isDigit = code >= 48 && code <= 57
    const isHyphen = code === 45
    if (!isLower && !isDigit && !isHyphen) {
      return { valid: false, reason: 'Only lowercase letters, numbers, and hyphens allowed' }
    }
  }

  return { valid: true }
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const PRICE_TIERS = [
  { chars: '1 char',   price: '$100' },
  { chars: '2 chars',  price: '$60' },
  { chars: '3 chars',  price: '$10' },
  { chars: '4 chars',  price: '$2' },
  { chars: '5+ chars', price: '$0.10' },
]
