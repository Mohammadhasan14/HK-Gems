"use client";

import { useEffect, useRef } from "react";
import { BeatSection } from "../BeatSection";
import { useScroll } from "@/store/useScroll";
import { toleranceValueMm } from "@/lib/tolerance";

/**
 * Beat 4 — Tolerance. The eyebrow's mm figure is a live readout (not static
 * copy): 12mm asymptotically closes toward 0.4mm as this beat scrolls by,
 * then guard-snaps to exactly 0.4mm in the final 2% (lib/tolerance.ts) —
 * paired with the exploded bezel parts drawing together in
 * components/canvas/BezelAssembly.tsx, driven by the same curve. Updated
 * via its own rAF loop reading live scroll state each frame (not a timer —
 * see ScrollProvider's "scroll is the only clock" rule; this reads the
 * clock, it doesn't run its own).
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
    <BeatSection id="tolerance">
      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
        Tolerance — <span ref={valueRef}>12.00</span>mm
      </p>
      <h2 className="mt-6 max-w-xl font-display text-3xl font-light text-white sm:text-5xl">
        Set by hand, to a tolerance you{" "}
        <em className="italic text-[#C9A227]">cannot see</em>.
      </h2>
    </BeatSection>
  );
}
