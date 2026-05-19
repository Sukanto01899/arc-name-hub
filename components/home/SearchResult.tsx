"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useReadContract, useSwitchChain } from "wagmi";
import { ARCNAMES_ABI, ARCNAMES_ADDRESS } from "@/lib/contracts";
import {
  formatExpiry,
  formatPrice,
  PRICE_TIERS,
  shortenAddress,
  validateName,
} from "@/lib/domain";
import { arcTestnet } from "@/lib/wagmi";

export function SearchResult({
  name,
  onRegister,
}: {
  name: string;
  onRegister: () => void;
}) {
  const validation = validateName(name);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isWrongChain = chainId !== arcTestnet.id;

  const { data: available, isLoading } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: "isAvailable",
    args: [name],
    query: { enabled: validation.valid },
  });

  const { data: price } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: "getPrice",
    args: [name],
    query: { enabled: validation.valid },
  });

  const { data: info } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: "getDomainInfo",
    args: [name],
    query: { enabled: validation.valid && available === false },
  });

  if (!validation.valid) {
    return (
      <ResultCard>
        <p className="text-sm" style={{ color: "var(--arc-cream)" }}>
          {validation.reason}
        </p>
      </ResultCard>
    );
  }

  if (isLoading) {
    return (
      <ResultCard>
        <div className="flex items-center gap-3">
          <span className="spinner" />
          <p className="text-sm" style={{ color: "var(--arc-muted2)" }}>
            Checking availability...
          </p>
        </div>
      </ResultCard>
    );
  }

  if (available === true) {
    return (
      <ResultCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--arc-cream)" }} />
              <span className="truncate text-2xl font-semibold" style={{ color: "var(--arc-text)" }}>
                {name}.arc
              </span>
              <Badge>Available</Badge>
            </div>
            {price !== undefined && (
              <p className="mt-2 text-sm" style={{ color: "var(--arc-muted2)" }}>
                {formatPrice(price)} USDC / year
              </p>
            )}
          </div>

          {!isConnected ? (
            <ConnectButton />
          ) : isWrongChain ? (
            <button
              onClick={() => switchChain({ chainId: arcTestnet.id })}
              className="rounded-[8px] px-5 py-3 text-sm font-semibold"
              style={{ background: "var(--arc-cream)", color: "var(--arc-bg)" }}
            >
              Switch Network
            </button>
          ) : (
            <button
              onClick={onRegister}
              className="rounded-[8px] px-6 py-3 text-sm font-bold transition hover:translate-y-[-1px]"
              style={{ background: "var(--arc-cream)", color: "var(--arc-bg)" }}
            >
              Register
            </button>
          )}
        </div>

        {price !== undefined && (
          <div
            className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4 text-xs"
            style={{ borderColor: "rgba(219,205,169,0.18)", color: "var(--arc-muted2)" }}
          >
            {[1, 2, 5].map((year) => (
              <span key={year} className="tabular-nums">
                {year} yr: <span style={{ color: "var(--arc-cream)" }}>{formatPrice(price * BigInt(year))} USDC</span>
              </span>
            ))}
          </div>
        )}
      </ResultCard>
    );
  }

  if (available === false) {
    return (
      <ResultCard>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--arc-red)" }} />
            <span className="truncate text-2xl font-semibold" style={{ color: "var(--arc-text)" }}>
              {name}.arc
            </span>
            <Badge muted>Registered</Badge>
          </div>
          {info && (
            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-4" style={{ color: "var(--arc-muted2)" }}>
              <span>
                Owner: <span className="font-mono">{shortenAddress(info.owner)}</span>
              </span>
              {info.expiry > 0n && <span>Expires {formatExpiry(info.expiry)}</span>}
            </div>
          )}
        </div>
      </ResultCard>
    );
  }

  return null;
}

export function SearchPriceNote({
  query,
  price,
}: {
  query: string;
  price: bigint | undefined;
}) {
  const validation = query ? validateName(query) : { valid: true };

  if (!query) {
    return (
      <div className="flex flex-wrap justify-center gap-2 text-xs" style={{ color: "var(--arc-muted2)" }}>
        {PRICE_TIERS.map((tier) => (
          <span key={tier.chars} className="rounded-full px-3 py-1" style={{ background: "rgba(219,205,169,0.08)" }}>
            {tier.chars} {tier.price}/yr
          </span>
        ))}
      </div>
    );
  }

  if (!validation.valid) {
    return (
      <p className="text-center text-sm" style={{ color: "var(--arc-cream)" }}>
        {validation.reason}
      </p>
    );
  }

  return (
    <p className="text-center text-sm" style={{ color: "var(--arc-muted2)" }}>
      Price for <span style={{ color: "var(--arc-cream)" }}>{query}.arc</span>:{" "}
      <span className="font-semibold" style={{ color: "var(--arc-cream)" }}>
        {price !== undefined ? `${formatPrice(price)} USDC / year` : "loading..."}
      </span>
    </p>
  );
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full animate-fade-slide-up rounded-[8px] p-5"
      style={{
        background: "rgba(2,15,41,0.86)",
        border: "1px solid rgba(219,205,169,0.22)",
        boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
      }}
    >
      {children}
    </div>
  );
}

function Badge({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        background: muted ? "rgba(255,77,106,0.14)" : "rgba(219,205,169,0.16)",
        color: muted ? "var(--arc-red)" : "var(--arc-cream)",
      }}
    >
      {children}
    </span>
  );
}
