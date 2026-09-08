"use client";

import { useEffect, useState } from "react";
import { BeatSection } from "../BeatSection";
import { BeatCopy } from "../BeatCopy";
import { chapterForBeat } from "@/lib/journey";
import { STONES, COLLECTION_ORDER } from "@/lib/stones";
import { vitrine } from "@/lib/vitrine";

const CHAPTER = chapterForBeat("collection");

/**
 * Beat 7 — The Collection. Placards for each stone; the one matching
 * whichever stone is currently "front" on the vitrine turntable
 * (components/canvas/Vitrine.tsx, via lib/vitrine.ts) is highlighted, the
 * rest dimmed. The footer wordmark closes the loader's gesture from Beat 1.
 */
export function Beat7Collection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setActiveIndex((prev) => (prev === vitrine.activeIndex ? prev : vitrine.activeIndex));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <BeatSection id="collection" align="top">
      <BeatCopy
        eyebrow={CHAPTER.eyebrow}
        roman="Six stones."
        italic="One workshop."
      >
        {/* Single column, not the two it used to be. Two columns pushed the
            placards out past the copy measure and straight under the vitrine
            stones orbiting the frame, so half the names were unreadable
            behind geometry. One column keeps the collection in the same left
            column every other scene uses. */}
        <ul className="mt-8 grid grid-cols-1 gap-4">
          {COLLECTION_ORDER.map((id, i) => {
            const stone = STONES[id];
            const active = i === activeIndex;
            return (
              <li
                key={id}
                className={`border-l pl-4 transition-colors duration-500 ${
                  active ? "border-[#C9A227]" : "border-[#C9A227]/20"
                }`}
              >
                {/* Name and Urdu name on one baseline. Stacked, the RTL
                    paragraph took the full column width and right-aligned
                    itself to the far edge of the measure, stranding each
                    Urdu name a long way from the stone it belongs to. */}
                <div className="flex items-baseline gap-3">
                  <p
                    className={`font-display text-xl font-light transition-colors duration-500 ${
                      active ? "text-white" : "text-white/40"
                    }`}
                  >
                    {stone.name}
                  </p>
                  <p
                    dir="rtl"
                    lang="ur"
                    className={`font-display text-sm transition-colors duration-500 ${
                      active ? "text-white/60" : "text-white/20"
                    }`}
                  >
                    {stone.urduName}
                  </p>
                </div>
                <p
                  className={`mt-1 font-sans text-[10px] uppercase tracking-[0.18em] transition-colors duration-500 ${
                    active ? "text-white/60" : "text-white/25"
                  }`}
                >
                  {stone.scientificName} — {stone.origin}
                </p>
              </li>
            );
          })}
        </ul>

        <p className="mt-14 font-sans text-xs font-light uppercase tracking-[0.32em] text-[#C9A227]">
          HK Gems
        </p>
      </BeatCopy>
    </BeatSection>
  );
}
