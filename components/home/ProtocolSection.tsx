export function ProtocolSection() {
  return (
    <section className="mx-auto grid min-h-[700px] w-full max-w-6xl items-center gap-14 px-6 py-24 sm:px-8 lg:grid-cols-2 lg:px-10">
      <div className="relative mx-auto aspect-square w-full max-w-[520px]">
        <div className="protocol-orbit">
          <div className="protocol-mark arc">A</div>
          <div className="protocol-mark base">-</div>
          <span className="bubble one" />
          <span className="bubble two" />
          <span className="bubble three" />
          <span className="bubble four" />
          <span className="bubble five" />
          <span className="bubble six" />
        </div>
      </div>
      <div>
        <h2 className="max-w-xl text-5xl font-medium leading-[1.05] sm:text-6xl lg:text-7xl" style={{ color: "var(--arc-text)" }}>
          Decentralized and open source
        </h2>
        <p className="mt-8 max-w-xl text-xl leading-relaxed" style={{ color: "var(--arc-muted2)" }}>
          ArcNames are built for open onchain identity: readable names, transparent ownership, and direct contract reads for apps.
        </p>
      </div>
    </section>
  );
}
