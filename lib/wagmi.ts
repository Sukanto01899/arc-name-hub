import { defineChain } from 'viem'
import { http, createConfig } from 'wagmi'
import { darkTheme } from '@rainbow-me/rainbowkit'

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
})

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
})

export const rainbowKitTheme = darkTheme({
  accentColor: '#4F6EF7',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
})
