import Image from "next/image";

const FEATURES = [
  {
    color: "var(--arc-green)",
    glow: "rgba(0,229,160,0.55)",
    title: "Fully onchain",
    desc: "Names and ownership live entirely on the Arc blockchain — no centralized registry or off-chain state.",
  },
  {
    color: "var(--arc-cyan)",
    glow: "rgba(0,210,255,0.55)",
    title: "App-native resolution",
    desc: "Any dApp can resolve names directly from the contract with a single read call.",
  },
  {
    color: "var(--arc-cream)",
    glow: "rgba(219,205,169,0.45)",
    title: "Self-sovereign",
    desc: "Transfer, renew, or set a primary name at any time. You own it completely.",
  },
];

export function ProtocolSection() {
  return (
    <section className="mx-auto grid min-h-[700px] w-full max-w-6xl items-center gap-14 px-6 py-24 sm:px-8 lg:grid-cols-2 lg:px-10">

      {/* Orbit visual */}
      <div className="relative mx-auto aspect-square w-full max-w-[520px]">
        <div className="protocol-orbit">

          {/* Decorative orbit rings */}
          <div className="protocol-ring outer" />
          <div className="protocol-ring inner" />

          {/* Arc circle — logo-1.png */}
          <div
            className="protocol-mark arc"
            style={{ animation: "float 7s ease-in-out 0s infinite" }}
          >
            <Image
              src="/logo-1.png"
              alt="Arc"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Base circle — Arc_Icon_Navy.png */}
          <div
            className="protocol-mark base"
            style={{ animation: "float 5.5s ease-in-out 1.3s infinite" }}
          >
            <Image
              src="/Arc_Icon_Navy.png"
              alt="Arc"
              fill
              style={{ objectFit: "cover", filter: "invert(1)" }}
            />
          </div>

          {/* Bubbles — each animated at different speed/delay */}
          <span className="bubble one"   style={{ animation: "float    8s   ease-in-out 0.4s infinite" }} />
          <span className="bubble two"   style={{ animation: "floatSway 6s  ease-in-out 1.0s infinite" }} />
          <span className="bubble three" style={{ animation: "float    7s   ease-in-out 2.2s infinite" }} />
          <span className="bubble four"  style={{ animation: "floatSway 9s  ease-in-out 0.7s infinite" }} />
          <span className="bubble five"  style={{ animation: "float    6.5s ease-in-out 1.6s infinite" }} />
          <span className="bubble six"   style={{ animation: "floatSway 7.5s ease-in-out 0.3s infinite" }} />
        </div>
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-6">
        <div>
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--arc-cream)" }}
          >
            Protocol
          </span>
          <h2
            className="mt-4 max-w-xl text-5xl font-medium leading-[1.05] sm:text-6xl"
            style={{ color: "var(--arc-text)" }}
          >
            Decentralized and open source
          </h2>
        </div>

        <p
          className="max-w-lg text-lg leading-relaxed"
          style={{ color: "var(--arc-muted2)" }}
        >
          ArcNames are built for open onchain identity — readable names,
          transparent ownership, and direct contract reads for any app on Arc.
        </p>

        <div className="flex flex-col gap-5 mt-2">
          {FEATURES.map(({ color, glow, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <span
                className="mt-[6px] shrink-0 w-2 h-2 rounded-full"
                style={{ background: color, boxShadow: `0 0 10px ${glow}` }}
              />
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--arc-text)" }}
                >
                  {title}
                </p>
                <p
                  className="text-sm mt-1 leading-relaxed"
                  style={{ color: "var(--arc-muted2)" }}
                >
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
