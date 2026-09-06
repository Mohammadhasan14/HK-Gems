"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BeatSection } from "../BeatSection";
import { HERO_STONE } from "@/lib/stones";

const LINES: Array<{ prefix: string; word: string }> = [
  { prefix: "Out of the", word: "mine" },
  { prefix: "Down the", word: "mountain" },
  { prefix: "Along the", word: "riverbed" },
];

/**
 * Beat 2 — Origin. Copy is the mine / mountain / riverbed triad from the
 * brief. Each line sits in an `overflow-hidden` mask and starts translated
 * fully below its own box; a scrubbed GSAP timeline reveals them in
 * sequence as the section scrolls through — "masked line reveals" from the
 * Phase 1 brief, paired with the strata descent in the 3D layer
 * (components/canvas/Strata.tsx) so text and rock layers surface together.
 * Scrubbed to the section's own scroll range (`scrub: 1`, per the site-wide
 * "scroll is the only clock" rule in ScrollProvider), not a fixed duration.
 */
export function Beat2Origin() {
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = document.querySelector('[data-beat="origin"]');
    const lines = lineRefs.current.filter(
      (el): el is HTMLParagraphElement => el !== null,
    );
    if (!section || lines.length === 0) return;

    gsap.set(lines, { yPercent: 100 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 70%",
        end: "top 15%",
        scrub: 1,
      },
    });
    tl.to(lines, { yPercent: 0, stagger: 0.35, ease: "none" });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <BeatSection id="origin" align="top">
      <div className="max-w-[34rem]">
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.42em] text-white/45">
          Chapter 02 — Origin
        </p>

        <div className="mt-7 space-y-3 font-display text-4xl font-light leading-[1.06] text-white sm:text-6xl lg:text-[4.25rem]">
          {LINES.map(({ prefix, word }, i) => (
            <div key={word} className="overflow-hidden pb-1">
              <p
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
              >
                {prefix} <em className="italic">{word}</em>.
              </p>
            </div>
          ))}
        </div>

        <span
          aria-hidden="true"
          className="mt-9 block h-px w-14 bg-[#C9A227]/70"
        />

        {/* Provenance, straight from the stone catalogue (lib/stones.ts) —
            the specimen the whole journey follows, stated plainly the way a
            gallery label would. Nothing invented for the layout's sake. */}
        <dl className="mt-7 space-y-2 font-sans text-[10px] uppercase tracking-[0.24em] text-white/40">
          <div className="flex gap-3">
            <dt className="w-20 text-white/25">Stone</dt>
            <dd>
              {HERO_STONE.name}
              <span className="ml-2 font-display text-xs normal-case tracking-normal text-white/30">
                {HERO_STONE.urduName}
              </span>
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 text-white/25">Species</dt>
            <dd>{HERO_STONE.scientificName}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 text-white/25">Origin</dt>
            <dd>{HERO_STONE.origin}</dd>
          </div>
        </dl>
      </div>
    </BeatSection>
  );
}
