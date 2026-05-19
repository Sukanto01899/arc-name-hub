const FAQS = [
  ["What are ArcNames?", "ArcNames are readable .arc names that point to wallets and profiles on Arc."],
  ["What are the ArcName registration fees?", "Pricing depends on name length. Short names cost more, and the live price appears as you type."],
  ["How do I get a free or discounted ArcName?", "Discounts can be added through future contract logic or campaigns. Current pricing is shown before registration."],
  ["How can I use ArcNames?", "Use a name as a readable onchain identity for receiving funds, profiles, and app integrations."],
  ["Is my profile information published onchain?", "The registered name, owner, expiry, and primary-name setting are contract data."],
  ["How do I integrate ArcNames to my app?", "Read from the ArcNames contract to resolve availability, ownership, expiry, and primary names."],
] as const;

export function FAQSection() {
  return (
    <section className="mx-auto grid min-h-[640px] w-full max-w-6xl items-center gap-12 px-6 py-24 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
      <div>
        <h2 className="text-5xl font-medium leading-[1.05] sm:text-6xl lg:text-7xl" style={{ color: "var(--arc-text)" }}>
          Questions?
          <br />
          See our FAQ
        </h2>
        <p className="mt-8 max-w-md text-xl leading-relaxed" style={{ color: "var(--arc-muted2)" }}>
          Get quick answers about registration, pricing, profile data, and app integrations.
        </p>
      </div>
      <div>
        {FAQS.map(([question, answer]) => (
          <details key={question} className="faq-row group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-lg font-semibold">
              <span>{question}</span>
              <span className="transition group-open:rotate-180">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </summary>
            <p className="pb-6 text-base leading-relaxed" style={{ color: "var(--arc-muted2)" }}>
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
