import { BeatSection } from "../BeatSection";

/**
 * Beat 1 — Arrival. The loader (components/dom/Loader.tsx) plays once on
 * mount, ahead of this headline; this content is what's underneath it the
 * whole time and what remains once it hands off.
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
