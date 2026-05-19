"use client";

import { SearchPriceNote, SearchResult } from "@/components/home/SearchResult";

const FLOATING_NAMES = [
  { name: "builder.arc", className: "left-[10%] top-[42%]", tone: "sand", blur: false },
  { name: "nova.arc", className: "left-[20%] top-[20%]", tone: "gold", blur: true },
  { name: "dcj.arc", className: "left-[46%] top-[8%]", tone: "green", blur: false },
  { name: "mentor.arc", className: "right-[14%] top-[21%]", tone: "blue", blur: true },
  { name: "wilson.arc", className: "right-[12%] bottom-[25%]", tone: "sand", blur: false },
  { name: "aflock.arc", className: "left-[46%] bottom-[10%]", tone: "green", blur: false },
  { name: "vault.arc", className: "left-[20%] bottom-[22%]", tone: "gold", blur: true },
] as const;

interface HeroSectionProps {
  inputValue: string;
  inputName: string;
  inputPrice: bigint | undefined;
  searchedName: string;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  onRegister: () => void;
}

export function HeroSection({
  inputValue,
  inputName,
  inputPrice,
  searchedName,
  onInputChange,
  onSearch,
  onRegister,
}: HeroSectionProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pb-20 pt-28 sm:px-8 lg:px-10">
      <div className="hero-grid" />
      {FLOATING_NAMES.map((item) => (
        <FloatingName key={item.name} {...item} />
      ))}
      <div className="relative z-20 flex w-full max-w-3xl flex-col items-center gap-7 text-center">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ background: "var(--arc-cream)" }} />
          <span className="text-lg font-semibold" style={{ color: "var(--arc-text)" }}>
            ArcNames
          </span>
        </div>
        <h1 className="text-5xl font-medium leading-[1.02] sm:text-7xl" style={{ color: "var(--arc-text)" }}>
          Build your Arc profile
        </h1>
        <p className="max-w-xl text-lg leading-relaxed" style={{ color: "var(--arc-muted2)" }}>
          Search, price, and register a readable .arc identity for wallets, profiles, and onchain apps.
        </p>

        <div className="w-full">
          <div
            className="grid min-h-20 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[8px]"
            style={{
              padding: "0.75rem clamp(1rem, 3vw, 1.5rem)",
              background: "rgba(2,15,41,0.9)",
              border: "1px solid rgba(219,205,169,0.32)",
              boxShadow: "0 26px 70px rgba(0,0,0,0.28)",
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={onInputChange}
              onKeyDown={(event) => event.key === "Enter" && onSearch()}
              placeholder="SEARCH FOR A NAME"
              maxLength={32}
              autoComplete="off"
              spellCheck={false}
              className="arc-search-input min-w-0 bg-transparent px-1 py-4 text-lg outline-none sm:px-2 sm:text-2xl"
              style={{ color: "var(--arc-text)", caretColor: "var(--arc-cream)" }}
            />
            <span className="select-none px-1 text-base sm:text-lg" style={{ color: inputValue ? "var(--arc-muted2)" : "transparent" }}>
              .arc
            </span>
            <button
              onClick={onSearch}
              aria-label="Search name"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] transition hover:scale-105"
              style={{ color: "var(--arc-bg)", background: "var(--arc-cream)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </div>
          <div className="mt-4 min-h-8">
            <SearchPriceNote query={inputName} price={inputPrice} />
          </div>
        </div>

        {searchedName && (
          <div className="w-full">
            <SearchResult name={searchedName} onRegister={onRegister} />
          </div>
        )}
      </div>
    </section>
  );
}

function FloatingName({
  name,
  className,
  tone,
  blur,
}: (typeof FLOATING_NAMES)[number]) {
  return (
    <div
      className={`pointer-events-none absolute z-0 hidden items-center gap-3 rounded-full border px-4 py-3 text-sm shadow-2xl md:flex ${className} ${blur ? "opacity-50 blur-[1.5px]" : "opacity-80"}`}
      style={{
        background: "rgba(2,15,41,0.72)",
        borderColor: "rgba(219,205,169,0.2)",
        color: "var(--arc-muted2)",
      }}
    >
      <span className={`avatar-dot ${tone}`} />
      {name}
    </div>
  );
}
