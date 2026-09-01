import { BeatSection } from "../BeatSection";

/**
 * Beat 2 — Origin. Copy is the mine / mountain / riverbed triad from the
 * brief. Phase 1 aligns each line's reveal to a parallax horizon line in
 * the 3D layer via masked line reveals; Phase 0 renders them statically.
 */
export function Beat2Origin() {
  return (
    <BeatSection id="origin">
      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
        Origin
      </p>
      <div className="mt-6 space-y-3 font-display text-3xl font-light text-white sm:text-5xl">
        <p>
          Out of the <em className="italic">mine</em>.
        </p>
        <p>
          Down the <em className="italic">mountain</em>.
        </p>
        <p>
          Along the <em className="italic">riverbed</em>.
        </p>
      </div>
    </BeatSection>
  );
}
