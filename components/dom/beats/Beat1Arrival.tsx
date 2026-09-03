import { BeatSection } from "../BeatSection";

/**
 * Beat 1 — Arrival. The loader (components/dom/Loader.tsx) plays once on
 * mount, ahead of this headline; this content is what's underneath it the
 * whole time and what remains once it hands off.
 */
export function Beat1Arrival() {
  return (
    <BeatSection id="arrival" className="items-start">
      <p className="font-sans text-xs font-medium uppercase tracking-[0.4em] text-white/50">
        HK Gems — Stones of Origin
      </p>
      <h1 className="mt-8 max-w-3xl font-display text-6xl font-light leading-[1.05] text-white sm:text-7xl lg:text-8xl">
        A stone <em className="italic text-[#C9A227]">carries</em> its
        mountain.
      </h1>
    </BeatSection>
  );
}
