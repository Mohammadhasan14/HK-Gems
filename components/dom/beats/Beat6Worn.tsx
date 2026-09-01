import { BeatSection } from "../BeatSection";

/**
 * Beat 6 — Worn. The 3D exits by overexposing to warm white; a photographic
 * plate is what remains (Phase 3). Placeholder image and TODO per the
 * brief — real plate is a design asset, not something to fabricate here.
 */
export function Beat6Worn() {
  return (
    <BeatSection id="worn" className="items-center text-center">
      {/* TODO(design): real photographic hand plate, ~2400x3000, warm-white
          grade matching the bloom exit this beat cuts to. */}
      <h2 className="max-w-lg font-display text-3xl font-light text-white sm:text-5xl">
        Worn, <em className="italic text-[#C9A227]">not displayed</em>.
      </h2>
      <a
        href="#enquire"
        className="mt-8 inline-block border border-[#C9A227]/50 px-6 py-3 font-sans text-[10px] uppercase tracking-[0.3em] text-[#C9A227] transition-colors hover:bg-[#C9A227]/10"
      >
        Enquire
      </a>
    </BeatSection>
  );
}
