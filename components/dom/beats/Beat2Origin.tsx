"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BeatSection } from "../BeatSection";
import { chapterForBeat } from "@/lib/journey";
import { HERO_STONE } from "@/lib/stones";

const CHAPTER = chapterForBeat("origin");

const LINES: Array<{ prefix: string; word: string }> = [
  { prefix: "Out of the", word: "mine" },
  { prefix: "Down the", word: "mountain" },
  { prefix: "Along the", word: "riverbed" },
];

const SPEC: Array<[string, string]> = [
  ["Stone", HERO_STONE.name],
  ["Species", HERO_STONE.scientificName],
  ["Origin", HERO_STONE.origin],
];

/**
 * Beat 2 — Descent. Copy is the mine / mountain / riverbed triad. Each line
 * sits in an `overflow-hidden` mask and starts translated fully below its own
 * box; a scrubbed GSAP timeline reveals them in sequence as the section
 * scrolls through, paired with the strata descent in the 3D layer
 * (components/canvas/Strata.tsx) so text and rock layers surface together.
 * Scrubbed to the section's own scroll range (`scrub: 1`, per the site-wide
 * "scroll is the only clock" rule in ScrollProvider), not a fixed duration.
 *
 * This is the one beat that does NOT use BeatCopy's headline: its three
 * masked lines are the headline, and they need individual refs to animate.
 * Everything around them — eyebrow, rule, body — is typeset to the same
 * values BeatCopy uses, so it still sits in the same system.
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
      {/* Measure and type scale mirror BeatCopy exactly — see the note
          there. This beat can't use the component because its three lines
          each need their own ref to animate, but it must not look different
          for it. */}
      <div className="max-w-[26rem]">
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.3em] text-white/45">
          {CHAPTER.eyebrow}
        </p>

        {/* A step down from BeatCopy's scale, and the one place the system
            bends on purpose: these are three fixed phrases, and at the
            common size "Down the mountain." breaks across two lines, which
            turns a three-line stanza into five and drops the masked reveal
            out of step with the text it is revealing. */}
        <div className="mt-6 font-display text-[2.1rem] font-light leading-[1.12] tracking-[-0.005em] text-white sm:text-[2.75rem] lg:text-[3.2rem]">
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

        <span aria-hidden="true" className="mt-8 block h-px w-10 bg-[#C9A227]" />

        {/* Provenance, straight from the stone catalogue (lib/stones.ts) —
            the specimen the whole journey follows, stated plainly the way a
            gallery label would. Nothing invented for the layout's sake. */}
        <dl className="mt-7 font-sans text-[10px] uppercase leading-[2.1] tracking-[0.22em] text-white/55">
          {SPEC.map(([label, value]) => (
            <div key={label} className="flex gap-4">
              <dt className="w-24 shrink-0 text-white/30">{label}</dt>
              <dd>
                {value}
                {label === "Stone" ? (
                  <span
                    dir="rtl"
                    lang="ur"
                    className="ml-3 font-display text-sm normal-case tracking-normal text-white/40"
                  >
                    {HERO_STONE.urduName}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </BeatSection>
  );
}
