export const ARCNAMES_ADDRESS = (process.env.NEXT_PUBLIC_ARCNAMES_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`

// Native USDC on Arc — no separate token contract needed.
// Payment goes via msg.value in register() and renew().

export const ARCNAMES_ABI = [
  {
    name: 'resolve',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'reverseLookup',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'isAvailable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getPrice',
    type: 'function',
    stateMutability: 'pure',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getDomainInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'owner', type: 'address' },
          { name: 'resolvedAddress', type: 'address' },
          { name: 'expiry', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'isValidName',
    type: 'function',
    stateMutability: 'pure',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'primaryName',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'register',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'renew',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'transferName',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'to', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'setPrimaryName',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [],
  },
  {
    name: 'NameRegistered',
    type: 'event',
    inputs: [
      { name: 'name',   type: 'string',  indexed: false },
      { name: 'owner',  type: 'address', indexed: false },
      { name: 'expiry', type: 'uint256', indexed: false },
      { name: 'price',  type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'NameTransferred',
    type: 'event',
    inputs: [
      { name: 'name', type: 'string',  indexed: false },
      { name: 'from', type: 'address', indexed: false },
      { name: 'to',   type: 'address', indexed: false },
    ],
  },
] as const
