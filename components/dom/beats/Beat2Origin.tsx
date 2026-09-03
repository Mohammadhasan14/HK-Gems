"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BeatSection } from "../BeatSection";

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
    <BeatSection id="origin">
      <p className="font-sans text-xs font-medium uppercase tracking-[0.3em] text-white/40">
        Origin
      </p>
      <div className="mt-8 space-y-4 font-display text-4xl font-light text-white sm:text-6xl lg:text-7xl">
        {LINES.map(({ prefix, word }, i) => (
          <div key={word} className="overflow-hidden">
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
    </BeatSection>
  );
}
