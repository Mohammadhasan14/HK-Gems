import { BeatSection } from "../BeatSection";

/**
 * Beat 3 — The Cut, the signature moment. The 3D layer carries it: the rough
 * is genuinely carved down to the finished gem by that cut's own facet
 * planes (lib/cutStages.ts), so the headline below is a caption on something
 * literally true of the geometry rather than a claim laid over a crossfade.
 *
 * Left column, like every other beat, so the stone keeps the right of frame.
 * It used to be centred, which put the copy squarely across the stone at the
 * exact moment the facets appear — competing with the one thing the beat
 * exists to show.
 */
export function Beat3Cut() {
  return (
    <BeatSection id="cut" align="top">
      <div className="max-w-[34rem]">
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.42em] text-white/45">
          Chapter 03 — The Cut
        </p>

        <h2 className="mt-7 font-display text-4xl font-light leading-[1.06] text-white sm:text-6xl lg:text-[4.25rem]">
          Precision
          <br />
          <em className="italic">reveals light.</em>
        </h2>

        <span aria-hidden="true" className="mt-9 block h-px w-14 bg-[#C9A227]/70" />

        <p className="mt-7 max-w-sm font-display text-lg font-light leading-relaxed text-white/55">
          Nothing is added. Only what does{" "}
          <em className="italic text-[#C9A227]">not belong</em> is taken away.
        </p>
      </div>
    </BeatSection>
  );
}
