import { BeatSection } from "../BeatSection";

/**
 * Beat 3 — The Cut, the signature moment. Phase 2 adds the cut-stage
 * geometry swap (lib/cutStages.ts) and the inside-the-hull camera solution
 * (components/canvas/HeroStone.tsx's BackSide flip) — both live. The
 * sweeping black plane is still outstanding; this headline is the one
 * refraction throws moving colour onto from inside the gem once that lands.
 */
export function Beat3Cut() {
  return (
    <BeatSection id="cut" className="items-center text-center">
      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
        The Cut
      </p>
      <h2 className="mt-6 max-w-2xl font-display text-3xl font-light text-white sm:text-5xl">
        Nothing is added. Only what does{" "}
        <em className="italic text-[#C9A227]">not belong</em> is taken away.
      </h2>
    </BeatSection>
  );
}
