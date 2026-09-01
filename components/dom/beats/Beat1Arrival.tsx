import { BeatSection } from "../BeatSection";

/**
 * Beat 1 — Arrival. Phase 0: static real copy only. Phase 1 adds the
 * loader (wordmark tracking 0 -> 0.3em as a counter runs to 100, digits
 * collapsing into the stone's specular highlight) ahead of this headline.
 */
export function Beat1Arrival() {
  return (
    <BeatSection id="arrival" className="items-start">
      <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">
        HK Gems — Stones of Origin
      </p>
      <h1 className="mt-6 max-w-xl font-display text-4xl font-light leading-tight text-white sm:text-6xl">
        A stone <em className="italic text-[#C9A227]">carries</em> its
        mountain.
      </h1>
    </BeatSection>
  );
}
