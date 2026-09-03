"use client";

import { useEffect, useState } from "react";
import { BeatSection } from "../BeatSection";
import { STONES, COLLECTION_ORDER } from "@/lib/stones";
import { vitrine } from "@/lib/vitrine";

/**
 * Beat 7 — The Collection. Six placards; the one matching whichever stone
 * is currently "front" on the vitrine turntable (components/canvas/
 * Vitrine.tsx, via lib/vitrine.ts) is highlighted, the rest dimmed. Footer
 * wordmark closes the loader's gesture from Beat 1.
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
    <BeatSection id="collection">
      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
        The Collection
      </p>
      <ul className="mt-8 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        {COLLECTION_ORDER.map((id, i) => {
          const stone = STONES[id];
          const active = i === activeIndex;
          return (
            <li
              key={id}
              className={`border-l pl-4 transition-colors duration-300 ${
                active ? "border-[#C9A227]" : "border-[#C9A227]/20"
              }`}
            >
              <p
                className={`font-display text-xl font-light transition-colors duration-300 ${
                  active ? "text-white" : "text-white/40"
                }`}
              >
                {stone.name}
              </p>
              <p
                dir="rtl"
                lang="ur"
                className={`font-display text-sm transition-colors duration-300 ${
                  active ? "text-white/60" : "text-white/20"
                }`}
              >
                {stone.urduName}
              </p>
              <p
                className={`mt-1 font-sans text-[10px] uppercase tracking-[0.15em] transition-colors duration-300 ${
                  active ? "text-white/70" : "text-white/25"
                }`}
              >
                {stone.scientificName} — {stone.origin}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-16 font-sans text-sm font-light uppercase tracking-[0.3em] text-[#C9A227]">
        HK Gems
      </p>
    </BeatSection>
  );
}
