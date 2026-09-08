"use client";

import { useEffect, useRef } from "react";
import { BeatSection } from "../BeatSection";
import { BeatCopy } from "../BeatCopy";
import { chapterForBeat } from "@/lib/journey";
import { useScroll } from "@/store/useScroll";
import { toleranceValueMm } from "@/lib/tolerance";

const CHAPTER = chapterForBeat("tolerance");

/**
 * Beat 4 — The Setting. The mm figure is a live readout, not static copy:
 * 12mm asymptotically closes toward 0.4mm as this beat scrolls by, then
 * guard-snaps to exactly 0.4mm in the final 2% (lib/tolerance.ts) — paired
 * with the exploded bezel parts drawing together in
 * components/canvas/BezelAssembly.tsx, driven by the same curve.
 *
 * Updated via its own rAF loop reading live scroll state each frame (not a
 * timer — see ScrollProvider's "scroll is the only clock" rule; this reads
 * the clock, it doesn't run its own). It sits in the body block rather than
 * the eyebrow so the eyebrow stays the plain scene marker every other beat
 * has, and the number reads as one of the beat's stated facts.
 */
export function Beat4Tolerance() {
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (valueRef.current) {
        const mm = toleranceValueMm(useScroll.getState().progress);
        valueRef.current.textContent = mm.toFixed(2);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <BeatSection id="tolerance" align="top">
      <BeatCopy
        eyebrow={CHAPTER.eyebrow}
        roman="Set by hand,"
        italic="to a tolerance you cannot see."
        lines={["Bezel closed by eye.", "Prongs seated by hand."]}
      >
        <p className="mt-3 font-sans text-[10px] uppercase leading-[2.1] tracking-[0.22em] text-[#C9A227]/80 tabular-nums">
          Tolerance — <span ref={valueRef}>12.00</span>mm
        </p>
      </BeatCopy>
    </BeatSection>
  );
}
