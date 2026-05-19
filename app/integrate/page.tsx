"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ProfilePanel } from "@/components/ProfilePanel";
import { ARCNAMES_ADDRESS } from "@/lib/contracts";

const CONTRACT_ADDRESS = ARCNAMES_ADDRESS;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        background: copied ? "rgba(0,229,160,0.12)" : "rgba(219,205,169,0.08)",
        color: copied ? "var(--arc-green)" : "var(--arc-muted2)",
        border: `1px solid ${copied ? "rgba(0,229,160,0.3)" : "rgba(219,205,169,0.15)"}`,
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function CodeBlock({ code, lang = "ts" }: { code: string; lang?: string }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ background: "rgba(2,10,28,0.85)", border: "1px solid rgba(219,205,169,0.12)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid rgba(219,205,169,0.08)" }}
      >
        <span className="text-xs font-mono" style={{ color: "var(--arc-muted)" }}>{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="px-5 py-4 overflow-x-auto text-sm leading-relaxed">
        <code style={{ color: "var(--arc-text)", fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace" }}>
          {code}
        </code>
      </pre>
    </div>
  );
}

function Section({ step, title, desc, children }: { step: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <span
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: "rgba(219,205,169,0.1)", border: "1px solid rgba(219,205,169,0.2)", color: "var(--arc-cream)" }}
        >
          {step}
        </span>
        <div>
          <h3 className="font-bold text-lg" style={{ color: "var(--arc-text)" }}>{title}</h3>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--arc-muted2)" }}>{desc}</p>
        </div>
      </div>
      <div className="ml-12">{children}</div>
    </div>
  );
}

const RESOLVE_CODE = `import { createPublicClient, http } from 'viem'
import { defineChain } from 'viem'

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
})

const client = createPublicClient({ chain: arcTestnet, transport: http() })

const ABI = [
  {
    name: 'resolve',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ type: 'address' }],
  },
] as const

// Resolve a .arc name → wallet address
const address = await client.readContract({
  address: '${CONTRACT_ADDRESS}',
  abi: ABI,
  functionName: 'resolve',
  args: ['yourname'],  // without .arc
})

console.log(address) // 0xabc...`;

const REVERSE_CODE = `const ABI = [
  {
    name: 'reverseLookup',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ type: 'string' }],
  },
] as const

// Reverse lookup: wallet address → .arc name
const name = await client.readContract({
  address: '${CONTRACT_ADDRESS}',
  abi: ABI,
  functionName: 'reverseLookup',
  args: ['0xYourWalletAddress'],
})

console.log(name ? \`\${name}.arc\` : 'No name set')`;

const WAGMI_CODE = `import { useReadContract } from 'wagmi'

const ABI = [
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
] as const

// In your React component:

// Resolve name → address
const { data: address } = useReadContract({
  address: '${CONTRACT_ADDRESS}',
  abi: ABI,
  functionName: 'resolve',
  args: ['sukanto'],
})

// Reverse lookup: address → name
const { data: arcName } = useReadContract({
  address: '${CONTRACT_ADDRESS}',
  abi: ABI,
  functionName: 'reverseLookup',
  args: [userAddress],
  query: { enabled: !!userAddress },
})

// Display: show name if available, fallback to address
const displayName = arcName ? \`\${arcName}.arc\` : shortenAddress(userAddress)`;

const ETHERS_CODE = `import { ethers } from 'ethers'

const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network')

const ABI = [
  'function resolve(string name) view returns (address)',
  'function reverseLookup(address wallet) view returns (string)',
]

const contract = new ethers.Contract('${CONTRACT_ADDRESS}', ABI, provider)

// Resolve
const address = await contract.resolve('sukanto')

// Reverse
const name = await contract.reverseLookup('0xYourAddress')`;

const DOMAIN_INFO_CODE = `const ABI = [
  {
    name: 'getDomainInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'name',            type: 'string'  },
        { name: 'owner',           type: 'address' },
        { name: 'resolvedAddress', type: 'address' },
        { name: 'expiry',          type: 'uint256' },
        { name: 'active',          type: 'bool'    },
      ],
    }],
  },
] as const

const info = await client.readContract({
  address: '${CONTRACT_ADDRESS}',
  abi: ABI,
  functionName: 'getDomainInfo',
  args: ['sukanto'],
})

console.log(info.owner)    // 0xabc...
console.log(info.active)   // true
console.log(info.expiry)   // Unix timestamp (BigInt)`;

export default function IntegratePage() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <Navbar onProfileClick={() => setShowProfile((v) => !v)} showProfilePanel={showProfile} />

      {showProfile && (
        <div className="fixed right-0 top-0 z-40 w-full px-6 pt-20 sm:w-auto sm:px-8 lg:px-10">
          <ProfilePanel onClose={() => setShowProfile(false)} />
        </div>
      )}

      <main className="min-h-screen px-6 pb-24 pt-24 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-3xl">

          {/* Back */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-10 text-sm transition-colors"
            style={{ color: "var(--arc-muted2)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--arc-text)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--arc-muted2)")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>

          {/* Hero */}
          <div className="mb-14">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--arc-cream)" }}
            >
              Developer Docs
            </span>
            <h1
              className="mt-3 text-4xl font-bold sm:text-5xl leading-tight"
              style={{ color: "var(--arc-text)" }}
            >
              Integrate ArcNames
              <br />
              <span style={{ color: "var(--arc-cream)" }}>into your app</span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed max-w-2xl" style={{ color: "var(--arc-muted2)" }}>
              Resolve human-readable <span style={{ color: "var(--arc-cream)" }}>.arc</span> names to wallet addresses with a single contract read. No API keys, no backend — just onchain.
            </p>

            {/* Contract address pill */}
            <div
              className="inline-flex items-center gap-3 mt-6 px-4 py-2.5 rounded-xl"
              style={{ background: "rgba(2,10,28,0.8)", border: "1px solid rgba(219,205,169,0.15)" }}
            >
              <span className="text-xs font-medium" style={{ color: "var(--arc-muted)" }}>Contract</span>
              <span className="font-mono text-sm" style={{ color: "var(--arc-cream)" }}>{CONTRACT_ADDRESS}</span>
              <CopyButton text={CONTRACT_ADDRESS} />
            </div>
          </div>

          {/* What you can do */}
          <div
            className="grid sm:grid-cols-3 gap-4 mb-14"
          >
            {[
              { icon: "⟶", color: "var(--arc-green)", label: "Forward resolve", desc: "name → address" },
              { icon: "⟵", color: "var(--arc-cyan)", label: "Reverse lookup", desc: "address → name" },
              { icon: "◎", color: "var(--arc-cream)", label: "Domain info", desc: "owner, expiry, status" },
            ].map(({ icon, color, label, desc }) => (
              <div
                key={label}
                className="rounded-xl px-5 py-4"
                style={{ background: "rgba(2,10,28,0.6)", border: "1px solid rgba(219,205,169,0.1)" }}
              >
                <span className="text-xl" style={{ color }}>{icon}</span>
                <p className="font-semibold mt-2 text-sm" style={{ color: "var(--arc-text)" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--arc-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-12">

            <Section
              step="1"
              title="Resolve a name to an address"
              desc="Given a .arc name, get the wallet address it points to. Use viem for a clean TypeScript experience."
            >
              <CodeBlock code={RESOLVE_CODE} lang="TypeScript · viem" />
            </Section>

            <div style={{ height: 1, background: "rgba(219,205,169,0.08)" }} />

            <Section
              step="2"
              title="Reverse lookup — address to name"
              desc="Show a .arc name instead of a raw 0x address in your UI. Falls back gracefully if the user has no name set."
            >
              <CodeBlock code={REVERSE_CODE} lang="TypeScript · viem" />
            </Section>

            <div style={{ height: 1, background: "rgba(219,205,169,0.08)" }} />

            <Section
              step="3"
              title="Using wagmi in React"
              desc="If your app already uses wagmi, plug in useReadContract directly. No extra setup needed."
            >
              <CodeBlock code={WAGMI_CODE} lang="TypeScript · wagmi + React" />
            </Section>

            <div style={{ height: 1, background: "rgba(219,205,169,0.08)" }} />

            <Section
              step="4"
              title="Using ethers.js"
              desc="Prefer ethers? The contract reads work identically — just swap in your provider."
            >
              <CodeBlock code={ETHERS_CODE} lang="TypeScript · ethers v6" />
            </Section>

            <div style={{ height: 1, background: "rgba(219,205,169,0.08)" }} />

            <Section
              step="5"
              title="Full domain info"
              desc="Need owner, expiry date, or active status? getDomainInfo returns everything in one call."
            >
              <CodeBlock code={DOMAIN_INFO_CODE} lang="TypeScript · viem" />
            </Section>

          </div>

          {/* Network info */}
          <div
            className="mt-16 rounded-2xl p-6"
            style={{ background: "rgba(2,10,28,0.7)", border: "1px solid rgba(219,205,169,0.12)" }}
          >
            <h3 className="font-bold text-base mb-4" style={{ color: "var(--arc-text)" }}>Network info</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: "Network", value: "Arc Testnet" },
                { label: "Chain ID", value: "5042002" },
                { label: "RPC", value: "https://rpc.testnet.arc.network" },
                { label: "Explorer", value: "testnet.arcscan.app" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span style={{ color: "var(--arc-muted)" }}>{label}</span>
                  <span className="font-mono text-right" style={{ color: "var(--arc-muted2)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LLM reference */}
          <div
            className="mt-16 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ background: "rgba(0,210,255,0.05)", border: "1px solid rgba(0,210,255,0.15)" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🤖</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--arc-text)" }}>
                  Using an AI agent or LLM?
                </p>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--arc-muted2)" }}>
                  Point your agent to our machine-readable reference — full ABI, code examples, and a ready-made system prompt snippet.
                </p>
              </div>
            </div>
            <a
              href="/integrate/llm.md"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "rgba(0,210,255,0.1)", border: "1px solid rgba(0,210,255,0.25)", color: "var(--arc-cyan)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              /integrate/llm.md
            </a>
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <p className="text-sm mb-4" style={{ color: "var(--arc-muted)" }}>
              Questions or need help integrating?
            </p>
            <a
              href="https://x.com/sukanto018"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "rgba(219,205,169,0.1)", border: "1px solid rgba(219,205,169,0.2)", color: "var(--arc-cream)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Ask on X
            </a>
          </div>

        </div>
      </main>
    </>
  );
}
