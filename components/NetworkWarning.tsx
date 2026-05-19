"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/wagmi";

export function NetworkWarning() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isConnected } = useAccount();

  if (!isConnected || chainId === arcTestnet.id) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-30 flex items-center justify-between gap-3 rounded-[8px] px-4 py-3 text-sm sm:left-auto sm:right-6"
      style={{
        background: "rgba(219,205,169,0.12)",
        border: "1px solid var(--arc-cream)",
        color: "var(--arc-cream)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span className="font-medium">Wrong network</span>
      <button
        onClick={() => switchChain({ chainId: arcTestnet.id })}
        className="rounded-[8px] px-3 py-1.5 text-xs font-bold"
        style={{ background: "var(--arc-cream)", color: "var(--arc-bg)" }}
      >
        Switch to Arc
      </button>
    </div>
  );
}
