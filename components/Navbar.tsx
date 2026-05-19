import { ARCNAMES_ABI, ARCNAMES_ADDRESS } from "@/lib/contracts";
import { shortenAddress } from "@/lib/domain";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";

function Navbar({
  onProfileClick,
  showProfilePanel,
}: {
  onProfileClick: () => void;
  showProfilePanel: boolean;
}) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 12);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: primaryName } = useReadContract({
    address: ARCNAMES_ADDRESS,
    abi: ARCNAMES_ABI,
    functionName: "primaryName",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const profileLabel = primaryName
    ? `${primaryName}.arc`
    : address
      ? shortenAddress(address)
      : "";

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 flex h-14 w-full items-center transition-all duration-300 sm:h-16"
      style={{
        paddingInline: "clamp(16px, 2.5vw, 40px)",
        background: hasScrolled ? "rgba(2, 15, 41, 0.72)" : "transparent",
        borderBottom: hasScrolled
          ? "1px solid rgba(219, 205, 169, 0.14)"
          : "1px solid transparent",
        backdropFilter: hasScrolled ? "blur(14px)" : "blur(0px)",
        WebkitBackdropFilter: hasScrolled ? "blur(14px)" : "blur(0px)",
      }}
    >
      <nav className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[8px] font-black"
            style={{
              background: "var(--arc-primary)",
              color: "var(--arc-cream)",
            }}
          >
            A
          </div>
          <span
            className="hidden text-sm font-semibold sm:inline"
            style={{ color: "var(--arc-cream)" }}
          >
            ArcNames
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          {!isConnected ? (
            <div className="arc-connect flex min-w-0 justify-end">
              <ConnectButton
                accountStatus="avatar"
                chainStatus="none"
                showBalance={false}
              />
            </div>
          ) : (
            <>
              <button
                onClick={() => router.push("/manage-name")}
                className="navbar-link flex h-12 shrink-0 items-center justify-center gap-2 rounded-[8px] px-3 text-sm font-semibold transition sm:px-4"
                style={{ color: "var(--arc-cream)" }}
                aria-label="Manage names"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M8 6h13" />
                  <path d="M8 12h13" />
                  <path d="M8 18h13" />
                  <path d="M3 6h.01" />
                  <path d="M3 12h.01" />
                  <path d="M3 18h.01" />
                </svg>
                <span className="hidden lg:inline">Manage Names</span>
              </button>
              <button
                onClick={onProfileClick}
                className="flex min-w-0 max-w-[52vw] items-center gap-2 rounded-full py-1 pl-1 pr-1 text-left md:max-w-[18rem]"
                aria-label="Open profile"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black"
                  style={{
                    background: showProfilePanel
                      ? "var(--arc-cream)"
                      : "var(--arc-primary)",
                    color: showProfilePanel
                      ? "var(--arc-bg)"
                      : "var(--arc-cream)",
                    border: "1px solid rgba(219,205,169,0.28)",
                  }}
                >
                  A
                </span>
                <span
                  className="hidden min-w-0 truncate text-sm font-bold md:inline md:text-base"
                  style={{ color: "var(--arc-text)" }}
                >
                  {profileLabel}
                </span>
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
