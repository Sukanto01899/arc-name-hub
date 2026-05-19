const FEATURE_CARDS = [
  ["Identity", "Build your onchain identity", "Use your ArcName as a readable profile across the Arc ecosystem.", "face"],
  ["Payments", "Simplify transactions", "Send and receive with a memorable name instead of a wallet address.", "coin"],
  ["Network", "Connect and collaborate", "Make builders, mentors, and apps easier to find by name.", "peace"],
] as const;

export function FeatureSection() {
  return (
    <section className="mx-auto grid min-h-[700px] w-full max-w-6xl items-center gap-12 px-6 py-24 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
      <h2 className="max-w-xl text-5xl font-medium leading-[1.05] sm:text-6xl lg:text-7xl" style={{ color: "var(--arc-text)" }}>
        Get so much more on Arc with your profile
      </h2>
      <div className="grid justify-items-end gap-6">
        {FEATURE_CARDS.map(([label, title, text, icon], index) => (
          <div
            key={label}
            className="feature-card flex w-full max-w-xl items-center gap-5 rounded-[8px] p-3 sm:p-4"
            style={{ transform: index === 1 ? "translateX(-3rem)" : index === 2 ? "translateX(-1.25rem)" : "none" }}
          >
            <FeatureIcon icon={icon} />
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: "var(--arc-cream)" }}>{label}</p>
              <h3 className="mt-1 text-xl font-semibold" style={{ color: "var(--arc-text)" }}>{title}</h3>
              <p className="mt-1 max-w-sm text-sm leading-relaxed" style={{ color: "var(--arc-muted2)" }}>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureIcon({ icon }: { icon: string }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[8px]" style={{ background: "var(--arc-primary)" }}>
      {icon === "coin" ? (
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--arc-cream)" strokeWidth="1.8">
          <circle cx="10" cy="12" r="6" />
          <path d="M14 6.8A6 6 0 1 1 14 17.2" />
          <path d="m10 8.8 1 2.1 2.3.3-1.7 1.6.4 2.2-2-1.1-2 1.1.4-2.2-1.7-1.6 2.3-.3 1-2.1Z" fill="var(--arc-cream)" stroke="none" />
        </svg>
      ) : icon === "peace" ? (
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--arc-cream)" strokeWidth="1.8" strokeLinecap="round">
          <path d="M8 11V5.8a1.8 1.8 0 0 1 3.6 0V11" />
          <path d="M11.6 11V4.8a1.8 1.8 0 0 1 3.6 0V12" />
          <path d="M15.2 12V7.5a1.8 1.8 0 0 1 3.6 0V14a7 7 0 0 1-14 0v-1.8a1.8 1.8 0 0 1 3.6 0V14" />
        </svg>
      ) : (
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--arc-cream)" strokeWidth="1.8">
          <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
          <circle cx="9" cy="11" r="1.5" fill="var(--arc-cream)" stroke="none" />
          <circle cx="15" cy="11" r="1.5" fill="var(--arc-cream)" stroke="none" />
          <path d="M8.5 16c1.8 1.3 5.2 1.3 7 0" />
        </svg>
      )}
    </div>
  );
}
