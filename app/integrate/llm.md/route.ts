import { ARCNAMES_ADDRESS } from '@/lib/contracts'

const md = `# ArcNames — LLM Integration Reference

> Machine-readable guide for AI agents and LLM-powered tools.
> Human guide: https://arcnames.vercel.app/integrate

## What is ArcNames?

ArcNames is a fully onchain name registry on the Arc blockchain (chain ID 5042002).
It maps short human-readable names (e.g. \`sukanto.arc\`) to wallet addresses.
Any app on Arc can resolve names with a single read call — no API key, no backend.

---

## Contract

- **Network:** Arc Testnet
- **Chain ID:** 5042002
- **Contract address:** ${ARCNAMES_ADDRESS}
- **RPC:** https://rpc.testnet.arc.network
- **Explorer:** https://testnet.arcscan.app

---

## ABI (minimal, read-only)

\`\`\`json
[
  {
    "name": "resolve",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "name", "type": "string" }],
    "outputs": [{ "type": "address" }]
  },
  {
    "name": "reverseLookup",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "wallet", "type": "address" }],
    "outputs": [{ "type": "string" }]
  },
  {
    "name": "isAvailable",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "name", "type": "string" }],
    "outputs": [{ "type": "bool" }]
  },
  {
    "name": "getDomainInfo",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "name", "type": "string" }],
    "outputs": [{
      "type": "tuple",
      "components": [
        { "name": "name",            "type": "string"  },
        { "name": "owner",           "type": "address" },
        { "name": "resolvedAddress", "type": "address" },
        { "name": "expiry",          "type": "uint256" },
        { "name": "active",          "type": "bool"    }
      ]
    }]
  },
  {
    "name": "primaryName",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "", "type": "address" }],
    "outputs": [{ "type": "string" }]
  }
]
\`\`\`

---

## Usage patterns

### 1. Resolve a .arc name to a wallet address (viem)

\`\`\`typescript
import { createPublicClient, http, defineChain } from 'viem'

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
})

const client = createPublicClient({ chain: arcTestnet, transport: http() })

const address = await client.readContract({
  address: '${ARCNAMES_ADDRESS}',
  abi: [{ name: 'resolve', type: 'function', stateMutability: 'view', inputs: [{ name: 'name', type: 'string' }], outputs: [{ type: 'address' }] }],
  functionName: 'resolve',
  args: ['sukanto'],  // .arc suffix not needed
})
// Returns: '0xabc...' or '0x0000000000000000000000000000000000000000' if not found
\`\`\`

### 2. Reverse lookup — wallet address to .arc name (viem)

\`\`\`typescript
const name = await client.readContract({
  address: '${ARCNAMES_ADDRESS}',
  abi: [{ name: 'reverseLookup', type: 'function', stateMutability: 'view', inputs: [{ name: 'wallet', type: 'address' }], outputs: [{ type: 'string' }] }],
  functionName: 'reverseLookup',
  args: ['0xUserWalletAddress'],
})
// Returns: 'sukanto' (without .arc) or '' if no primary name set
const display = name ? \`\${name}.arc\` : '0xUserWalletAddress'
\`\`\`

### 3. React + wagmi

\`\`\`typescript
import { useReadContract } from 'wagmi'

// Forward resolve
const { data: resolvedAddress } = useReadContract({
  address: '${ARCNAMES_ADDRESS}',
  abi: [{ name: 'resolve', type: 'function', stateMutability: 'view', inputs: [{ name: 'name', type: 'string' }], outputs: [{ type: 'address' }] }],
  functionName: 'resolve',
  args: ['sukanto'],
})

// Reverse lookup
const { data: arcName } = useReadContract({
  address: '${ARCNAMES_ADDRESS}',
  abi: [{ name: 'reverseLookup', type: 'function', stateMutability: 'view', inputs: [{ name: 'wallet', type: 'address' }], outputs: [{ type: 'string' }] }],
  functionName: 'reverseLookup',
  args: [userAddress],
  query: { enabled: !!userAddress },
})
\`\`\`

### 4. ethers.js v6

\`\`\`typescript
import { ethers } from 'ethers'

const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network')
const contract = new ethers.Contract(
  '${ARCNAMES_ADDRESS}',
  ['function resolve(string) view returns (address)', 'function reverseLookup(address) view returns (string)'],
  provider
)

const address = await contract.resolve('sukanto')
const name    = await contract.reverseLookup('0xUserAddress')
\`\`\`

### 5. Full domain info

\`\`\`typescript
const info = await client.readContract({
  address: '${ARCNAMES_ADDRESS}',
  abi: [{
    name: 'getDomainInfo', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ type: 'tuple', components: [
      { name: 'name',            type: 'string'  },
      { name: 'owner',           type: 'address' },
      { name: 'resolvedAddress', type: 'address' },
      { name: 'expiry',          type: 'uint256' },
      { name: 'active',          type: 'bool'    },
    ]}],
  }],
  functionName: 'getDomainInfo',
  args: ['sukanto'],
})

// info.owner           → '0xabc...'
// info.active          → true | false
// info.expiry          → BigInt Unix timestamp
// info.resolvedAddress → '0xabc...'
\`\`\`

---

## Key rules

- Name input is always **without** the \`.arc\` suffix (pass \`'sukanto'\` not \`'sukanto.arc'\`)
- \`resolve()\` returns the zero address (\`0x000...000\`) when a name does not exist — check for this
- \`reverseLookup()\` returns an empty string \`''\` when no primary name is set
- Names are case-insensitive — normalize to lowercase before querying
- \`expiry\` is a Unix timestamp as \`BigInt\` — compare with \`BigInt(Math.floor(Date.now() / 1000))\`

---

## Prompt template for AI agents

Use this system prompt snippet to give your agent ArcNames awareness:

\`\`\`
You can resolve Arc blockchain names using the ArcNames contract at ${ARCNAMES_ADDRESS} on Arc Testnet (chain ID 5042002, RPC: https://rpc.testnet.arc.network).
Call resolve(name) to get a wallet address from a .arc name (pass name without .arc suffix).
Call reverseLookup(address) to get a .arc name from a wallet address (returns empty string if none).
Zero address returned from resolve() means the name does not exist.
\`\`\`

---

*Generated by ArcNames · https://arcnames.vercel.app/integrate/llm.md*
`

export async function GET() {
  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
