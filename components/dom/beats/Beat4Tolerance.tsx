import { BeatSection } from "../BeatSection";

/**
 * Beat 4 — Tolerance. Phase 3 wires the actual exploded-diagram closing
 * (12mm -> 0.4mm over ~140vh, asymptotic, with the guarded final-2% snap).
 * pinVh for this beat in lib/beats.ts is already set to 140 to match.
 */
export function Beat4Tolerance() {
  return (
    <BeatSection id="tolerance">
      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
        Tolerance — 12mm to 0.4mm
      </p>
      <h2 className="mt-6 max-w-xl font-display text-3xl font-light text-white sm:text-5xl">
        Set by hand, to a tolerance you{" "}
        <em className="italic text-[#C9A227]">cannot see</em>.
      </h2>
    </BeatSection>
  );
}
