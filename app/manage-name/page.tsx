"use client";

import { useState, useEffect, useRef } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ARCNAMES_ADDRESS, ARCNAMES_ABI } from "@/lib/contracts";
import { getDaysUntilExpiry } from "@/lib/domain";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { ProfilePanel } from "@/components/ProfilePanel";

const CHUNK = 9_999n;

function useOwnedDomains(address: `0x${string}` | undefined) {
  const [names, setNames] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  const publicClient = usePublicClient();

  // 1. Show localStorage instantly — no loading state, no spinner
  useEffect(() => {
    if (!address) { setNames([]); return; }
    try {
      const stored = localStorage.getItem(`arcnames_domains_${address.toLowerCase()}`);
      setNames(stored ? JSON.parse(stored) : []);
    } catch { setNames([]); }
  }, [address]);

  // 2. Background chain sync — non-blocking, updates names if anything new is found
  useEffect(() => {
    if (!address || !publicClient) return;
    let cancelled = false;
    const domainKey = `arcnames_domains_${address.toLowerCase()}`;
    const syncKey   = `arcnames_sync_${address.toLowerCase()}`;

    const sync = async () => {
      try {
        const latest = await publicClient.getBlockNumber();

        // Only scan blocks since last sync; on first run scan last 50k blocks
        let fromBlock: bigint;
        try {
          const s = localStorage.getItem(syncKey);
          fromBlock = s ? BigInt(JSON.parse(s).block) + 1n : latest > 50_000n ? latest - 50_000n : 0n;
        } catch {
          fromBlock = latest > 50_000n ? latest - 50_000n : 0n;
        }

        if (fromBlock > latest || cancelled) return;

        // Build ranges and fetch all chunks in parallel
        const ranges: { from: bigint; to: bigint }[] = [];
        for (let f = fromBlock; f <= latest; f += CHUNK) {
          ranges.push({ from: f, to: f + CHUNK - 1n < latest ? f + CHUNK - 1n : latest });
        }

        const results = await Promise.all(
          ranges.map(({ from, to }) => Promise.all([
            publicClient.getContractEvents({ address: ARCNAMES_ADDRESS, abi: ARCNAMES_ABI, eventName: "NameRegistered", fromBlock: from, toBlock: to }),
            publicClient.getContractEvents({ address: ARCNAMES_ADDRESS, abi: ARCNAMES_ABI, eventName: "NameTransferred", fromBlock: from, toBlock: to }),
          ]))
        );

        if (cancelled) return;

        const lc = address.toLowerCase();
        let updated: string[] = [];
        try { updated = JSON.parse(localStorage.getItem(domainKey) ?? "[]"); } catch {}

        for (const [reg, trans] of results) {
          reg
            .filter((l) => (l.args.owner as string)?.toLowerCase() === lc)
            .forEach((l) => { if (l.args.name && !updated.includes(l.args.name as string)) updated.unshift(l.args.name as string); });
          trans
            .filter((l) => (l.args.to as string)?.toLowerCase() === lc)
            .forEach((l) => { if (l.args.name && !updated.includes(l.args.name as string)) updated.unshift(l.args.name as string); });
          trans
            .filter((l) => (l.args.from as string)?.toLowerCase() === lc)
            .forEach((l) => { updated = updated.filter((n) => n !== (l.args.name as string)); });
        }

        try { localStorage.setItem(domainKey, JSON.stringify(updated)); } catch {}
        try { localStorage.setItem(syncKey, JSON.stringify({ block: latest.toString() })); } catch {}

        if (!cancelled) setNames(updated);
      } catch (e) {
        console.error("Background chain sync failed:", e);
      }
    };

    sync();
    return () => { cancelled = true; };
  }, [address, publicClient, tick]);

  const refetch = () => setTick((t) => t + 1);
  return { names, refetch };
}

function getExpiryLabel(expiry: bigint): string {
  if (expiry <= BigInt(0)) return "—";
  const days = getDaysUntilExpiry(expiry);
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days < 30) return `Expires in ${days} day${days !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `Expires in ${months} month${months !== 1 ? "s" : ""}`;
}

function TransferModal({
  name,
  onClose,
  onSuccess,
}: {
  name: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [toAddress, setToAddress] = useState("");
  const [validationError, setValidationError] = useState("");
  const qc = useQueryClient();

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      qc.invalidateQueries();
      onSuccess();
    }
  }, [isSuccess, qc, onSuccess]);

  const handleTransfer = () => {
    const trimmed = toAddress.trim();
    if (!trimmed.startsWith("0x") || trimmed.length !== 42) {
      setValidationError("Enter a valid Ethereum address (0x...)");
      return;
    }
    setValidationError("");
    writeContract({
      address: ARCNAMES_ADDRESS,
      abi: ARCNAMES_ABI,
      functionName: "transferName",
      args: [name, trimmed as `0x${string}`],
    });
  };

  const busy = isPending || isConfirming;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(2,15,41,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 animate-modal-in"
        style={{
          background: "var(--arc-surface)",
          border: "1px solid var(--arc-border)",
          boxShadow: "0 16px 64px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3
              className="font-bold text-lg leading-tight"
              style={{ color: "var(--arc-text)" }}
            >
              Transfer {name}.arc
            </h3>
            <p className="text-sm mt-1" style={{ color: "var(--arc-muted2)" }}>
              Ownership moves to the recipient permanently.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-0.5 shrink-0 text-lg leading-none"
            style={{ color: "var(--arc-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Input */}
        <input
          type="text"
          value={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value);
            setValidationError("");
          }}
          placeholder="Recipient address (0x...)"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: "var(--arc-surface2)",
            border: `1px solid ${validationError ? "var(--arc-red)" : "var(--arc-border)"}`,
            color: "var(--arc-text)",
          }}
          disabled={busy}
        />
        {validationError && (
          <p className="text-xs mt-1.5" style={{ color: "var(--arc-red)" }}>
            {validationError}
          </p>
        )}
        {writeError && (
          <p className="text-xs mt-1.5" style={{ color: "var(--arc-red)" }}>
            Transaction failed. Please try again.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "var(--arc-surface2)", color: "var(--arc-muted2)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={busy || !toAddress}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "var(--arc-red)", color: "var(--arc-text)" }}
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner" style={{ width: 14, height: 14 }} />
                {isConfirming ? "Confirming…" : "Sending…"}
              </span>
            ) : (
              "Transfer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DomainCard({
  name,
  isPrimary,
  onSetPrimary,
  onTransferred,
}: {
  name: string;
  isPrimary: boolean;
  onSetPrimary: (name: string) => void;
  onTransferred: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: info } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: "getDomainInfo",
    args: [name],
    query: { enabled: !!name },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const expiry = info?.expiry ?? BigInt(0);
  const expiryLabel = getExpiryLabel(expiry);
  const initial = name.charAt(0).toUpperCase();

  return (
    <>
      <div
        className="relative flex items-center gap-4 px-5 py-4 rounded-2xl animate-fade-slide-up"
        style={{
          background: "var(--arc-surface2)",
          zIndex: showMenu ? 10 : 1,
        }}
      >
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex shrink-0 items-center justify-center font-bold text-lg select-none"
          style={{
            background: "rgba(219,205,169,0.15)",
            color: "var(--arc-cream)",
          }}
        >
          {initial}
        </div>

        {/* Name + expiry */}
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-base truncate"
            style={{ color: "var(--arc-cream)" }}
          >
            {name}.arc
          </p>
          <p className="text-sm mt-0.5" style={{ color: "rgba(246,241,229,0.6)" }}>
            {expiryLabel}
          </p>
        </div>

        {/* Primary badge */}
        {isPrimary && (
          <span
            className="px-3 py-1 rounded-full text-sm font-medium shrink-0"
            style={{
              border: "1.5px solid rgba(246,241,229,0.65)",
              color: "var(--arc-text)",
            }}
          >
            Primary
          </span>
        )}

        {/* Three-dot menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{
              color: "var(--arc-text)",
              background: showMenu
                ? "rgba(246,241,229,0.22)"
                : "rgba(246,241,229,0.12)",
            }}
            aria-label="Domain options"
          >
            <svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor">
              <circle cx="2" cy="2" r="1.5" />
              <circle cx="2" cy="8" r="1.5" />
              <circle cx="2" cy="14" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-10 w-44 rounded-xl py-1 animate-fade-in"
              style={{
                background: "var(--arc-surface)",
                border: "1px solid var(--arc-border)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                zIndex: 50,
              }}
            >
              <button
                onClick={() => { onSetPrimary(name); setShowMenu(false); }}
                disabled={isPrimary}
                className="w-full text-left px-4 py-2.5 text-sm disabled:opacity-40 transition-colors"
                style={{ color: "var(--arc-text)" }}
                onMouseEnter={(e) => {
                  if (!isPrimary) e.currentTarget.style.background = "var(--arc-surface2)";
                }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Set Primary
              </button>
              <div style={{ height: 1, background: "var(--arc-border)", margin: "2px 0" }} />
              <button
                onClick={() => { setShowTransfer(true); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{ color: "var(--arc-red)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--arc-surface2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Transfer
              </button>
            </div>
          )}
        </div>
      </div>

      {showTransfer && (
        <TransferModal
          name={name}
          onClose={() => setShowTransfer(false)}
          onSuccess={() => {
            setShowTransfer(false);
            onTransferred();
          }}
        />
      )}
    </>
  );
}

export default function ManageNamePage() {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const { address, isConnected } = useAccount();
  const { names, refetch } = useOwnedDomains(address);

  const { data: primaryName, refetch: refetchPrimary } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: "primaryName",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: writeData } = useWriteContract();
  const { isSuccess: setPrimarySuccess } = useWaitForTransactionReceipt({ hash: writeData });
  const qc = useQueryClient();

  useEffect(() => {
    if (setPrimarySuccess) {
      refetchPrimary();
      qc.invalidateQueries();
    }
  }, [setPrimarySuccess, refetchPrimary, qc]);

  const handleSetPrimary = (name: string) => {
    writeContract({
      address: ARCNAMES_ADDRESS,
      abi: ARCNAMES_ABI,
      functionName: "setPrimaryName",
      args: [name],
    });
  };

  return (
    <>
      <Navbar
        onProfileClick={() => setShowProfile((v) => !v)}
        showProfilePanel={showProfile}
      />

      {showProfile && (
        <div className="fixed right-0 top-0 z-40 w-full px-6 pt-20 sm:w-auto sm:px-8 lg:px-10">
          <ProfilePanel onClose={() => setShowProfile(false)} />
        </div>
      )}

      <main className="min-h-screen px-6 pb-16 pt-24 sm:px-8 lg:px-10">
        <section className="mx-auto w-full max-w-2xl">
          {/* Back button */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 mb-8 text-sm transition-colors"
            style={{ color: "var(--arc-muted2)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--arc-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--arc-muted2)")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>

          {/* Heading row */}
          <div className="flex items-center justify-between mb-6">
            <h1
              className="text-3xl font-bold sm:text-4xl"
              style={{ color: "var(--arc-text)" }}
            >
              My ArcNames
            </h1>
            <Link
              href="/"
              className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-light transition-colors"
              style={{ border: "1.5px solid var(--arc-border)", color: "var(--arc-muted2)" }}
              title="Register a new name"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--arc-text)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(219,205,169,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--arc-muted2)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--arc-border)";
              }}
            >
              +
            </Link>
          </div>

          {/* Not connected */}
          {!isConnected ? (
            <div
              className="rounded-2xl p-10 flex flex-col items-center gap-5 text-center"
              style={{ background: "var(--arc-surface)", border: "1px solid var(--arc-border)" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: "var(--arc-surface2)" }}
              >
                ◎
              </div>
              <p style={{ color: "var(--arc-muted2)" }}>
                Connect your wallet to see your ArcNames.
              </p>
              <div className="arc-connect">
                <ConnectButton />
              </div>
            </div>
          ) : names.length === 0 ? (
            <div
              className="rounded-2xl p-10 flex flex-col items-center gap-5 text-center"
              style={{ background: "var(--arc-surface)", border: "1px solid var(--arc-border)" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: "var(--arc-surface2)" }}
              >
                ◎
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--arc-text)" }}>
                  No ArcNames yet
                </p>
                <p className="text-sm" style={{ color: "var(--arc-muted2)" }}>
                  Register your first name to get started.
                </p>
              </div>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: "var(--arc-surface2)", color: "var(--arc-text)" }}
              >
                Register a Name →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {names.map((name) => (
                <DomainCard
                  key={name}
                  name={name}
                  isPrimary={primaryName === name}
                  onSetPrimary={handleSetPrimary}
                  onTransferred={refetch}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
