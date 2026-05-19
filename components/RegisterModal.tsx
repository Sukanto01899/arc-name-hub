"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ARCNAMES_ADDRESS, ARCNAMES_ABI } from "@/lib/contracts";
import { formatPrice } from "@/lib/domain";
import { arcTestnet } from "@/lib/wagmi";

interface Props {
  name: string;
  pricePerYear: bigint;
  isConnected: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

const YEAR_OPTIONS = [1, 2, 3, 5] as const;

export function RegisterModal({
  name,
  pricePerYear,
  isConnected,
  onSuccess,
  onClose,
}: Props) {
  const [years, setYears] = useState<1 | 2 | 3 | 5>(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const chainId = useChainId();
  const isWrongChain = chainId !== arcTestnet.id;

  const totalPrice = pricePerYear * BigInt(years);

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + years);
  const expiryStr = expiryDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isTxSuccess) setSuccess(true);
  }, [isTxSuccess]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleRegister = useCallback(() => {
    setError(null);
    writeContract({
      address: ARCNAMES_ADDRESS,
      abi: ARCNAMES_ABI,
      functionName: "register",
      args: [name, BigInt(years)],
      value: totalPrice,
    });
  }, [writeContract, name, years, totalPrice]);

  const isLoading = isPending || isConfirming;

  if (success) {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col items-center text-center py-2 gap-5">
          {/* Success icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              background: "rgba(0,229,160,0.1)",
              border: "1.5px solid var(--arc-green)",
              color: "var(--arc-green)",
              boxShadow: "0 0 32px rgba(0,229,160,0.2)",
            }}
          >
            ✓
          </div>

          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--arc-text)" }}
            >
              <span style={{ color: "var(--arc-cream)" }}>{name}.arc</span> is
              yours!
            </h2>
            <p
              className="text-sm mt-1.5"
              style={{ color: "var(--arc-muted2)" }}
            >
              Registered for {years} year{years > 1 ? "s" : ""}. Expires{" "}
              {expiryStr}.
            </p>
          </div>

          {txHash && (
            <a
              href={`https://testnet.arcscan.app/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
              style={{ color: "var(--arc-cyan)" }}
            >
              View on ArcScan
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          <button
            onClick={onSuccess}
            className="w-full py-3 rounded-xl font-semibold mt-1 transition-opacity hover:opacity-90"
            style={{
              background: "var(--arc-cream)",
              color: "var(--arc-bg)",
            }}
          >
            Done
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--arc-text)" }}
          >
            Register{" "}
            <span style={{ color: "var(--arc-cream)" }}>{name}.arc</span>
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--arc-muted)" }}>
            Pay with USDC
          </p>
        </div>

        {/* Year selector */}
        <div className="grid grid-cols-4 gap-2">
          {YEAR_OPTIONS.map((y) => {
            const active = years === y;
            return (
              <button
                key={y}
                onClick={() => setYears(y)}
                className="flex flex-col items-center py-3 px-2 rounded-xl transition-all"
                style={{
                  background: active
                    ? "rgba(219,205,169,0.1)"
                    : "rgba(41,88,130,0.25)",
                  border: `1.5px solid ${active ? "var(--arc-cream)" : "rgba(219,205,169,0.12)"}`,
                  color: active ? "var(--arc-cream)" : "var(--arc-muted2)",
                  boxShadow: active ? "0 0 16px rgba(219,205,169,0.1)" : "none",
                }}
              >
                <span className="font-bold text-sm">{y} yr</span>
                <span
                  className="text-xs mt-0.5"
                  style={{
                    color: active
                      ? "rgba(219,205,169,0.7)"
                      : "var(--arc-muted)",
                  }}
                >
                  {formatPrice(pricePerYear * BigInt(y))}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div
          className="rounded-xl p-4 flex flex-col gap-2.5 text-sm"
          style={{
            background: "rgba(2,15,41,0.55)",
            border: "1px solid rgba(219,205,169,0.12)",
          }}
        >
          <Row label="Domain" value={`${name}.arc`} />
          <Row
            label="Duration"
            value={`${years} year${years > 1 ? "s" : ""}`}
          />
          <Row label="Expires" value={expiryStr} />
          <div
            className="h-px my-0.5"
            style={{ background: "rgba(219,205,169,0.1)" }}
          />
          <div className="flex items-center justify-between font-semibold">
            <span style={{ color: "var(--arc-muted2)" }}>Total</span>
            <span style={{ color: "var(--arc-cream)" }}>
              {formatPrice(totalPrice)} USDC
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="text-sm px-4 py-3 rounded-xl"
            style={{
              background: "rgba(255,77,106,0.08)",
              color: "var(--arc-red)",
              border: "1px solid rgba(255,77,106,0.25)",
            }}
          >
            {error}
          </div>
        )}

        {/* Action */}
        {!isConnected ? (
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        ) : isWrongChain ? (
          <div
            className="text-center text-sm py-3 rounded-xl"
            style={{
              background: "rgba(255,184,0,0.08)",
              color: "var(--arc-yellow)",
              border: "1px solid rgba(255,184,0,0.25)",
            }}
          >
            Switch to Arc Testnet to continue
          </div>
        ) : (
          <button
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-55"
            style={{
              background: isLoading ? "rgba(219,205,169,0.7)" : "#dbcda9",
              color: "var(--arc-bg)",
              boxShadow: isLoading ? "none" : "0 0 24px rgba(219,205,169,0.2)",
            }}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner"
                  style={{
                    borderTopColor: "var(--arc-bg)",
                    width: 16,
                    height: 16,
                  }}
                />
                {isConfirming ? "Registering…" : "Confirm in wallet…"}
              </>
            ) : (
              `Register for ${formatPrice(totalPrice)} USDC`
            )}
          </button>
        )}
      </div>
    </ModalShell>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{
        background: "rgba(2,10,28,0.8)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md animate-modal-in relative rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-8 sm:pb-6"
        style={{
          background: "rgba(6,18,44,0.97)",
          border: "1px solid rgba(219,205,169,0.18)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(219,205,169,0.05)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          maxHeight: "92svh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div
          className="sm:hidden w-10 h-1 rounded-full mx-auto mb-5"
          style={{ background: "rgba(219,205,169,0.2)" }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors"
          style={{
            color: "var(--arc-muted)",
            background: "rgba(41,88,130,0.35)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--arc-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--arc-muted)";
          }}
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: "var(--arc-muted)" }}>{label}</span>
      <span style={{ color: "var(--arc-muted2)" }}>{value}</span>
    </div>
  );
}
