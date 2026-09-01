import { BeatSection } from "../BeatSection";

/**
 * Beat 2->3 — The Inhale. A pure transition: haze and dust accelerate
 * inward and roughness snaps 0.9 -> 0.02 the instant the last mote passes
 * the hull (Phase 1). No headline competes with that — just an eyebrow, so
 * the beat is still visible to the dev HUD and to screen readers.
 */
export function BeatInhale() {
  return (
    <BeatSection id="inhale" className="items-center text-center">
      <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/30">
        The Inhale
      </p>
    </BeatSection>
  );
}
