import { BeatSection } from "../BeatSection";

/**
 * Beat 1 — Arrival. The loader (components/dom/Loader.tsx) plays once on
 * mount, ahead of this headline; this content is what's underneath it the
 * whole time and what remains once it hands off.
 *
 * Composition is a single left column deliberately capped well short of
 * half the viewport: the stone is framed right of centre by the camera
 * (lib/curve.ts waypoints 0-1), and the two must not overlap. Headline sets
 * roman then italic across two lines, the editorial arrangement — one
 * statement, weighted, rather than a wall of type.
 */
export function Beat1Arrival() {
  return (
    <BeatSection id="arrival" className="items-start">
      <div className="max-w-[34rem]">
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.42em] text-white/45">
          HK Gems — Stones of Origin
        </p>

        <h1 className="mt-7 font-display text-6xl font-light leading-[0.98] tracking-[-0.01em] text-white sm:text-7xl lg:text-[5.75rem]">
          A stone carries
          <br />
          <em className="italic">its mountain.</em>
        </h1>

        <span
          aria-hidden="true"
          className="mt-9 block h-px w-14 bg-[#C9A227]/70"
        />

        <p className="mt-7 max-w-xs font-display text-lg font-light leading-relaxed text-white/55">
          Natural stones. Precisely cut.
          <br />
          Hand-finished in sterling silver.
        </p>
      </div>
    </BeatSection>
  );
}
