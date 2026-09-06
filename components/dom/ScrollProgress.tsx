"use client";

import { useEffect, useRef } from "react";
import { useScroll } from "@/store/useScroll";
import { CHAPTERS, chapterIndexForBeat } from "@/lib/journey";

/**
 * The right-hand progress hairline: current chapter number, a thin rule that
 * fills with gold as the page advances, next chapter number. Deliberately
 * the quietest element on screen — it must never compete with the stone.
 *
 * Progress changes every frame, so this does NOT subscribe to it through
 * React. It takes the store's transient subscription and writes
 * `transform: scaleY()` straight onto the fill element — the same
 * non-reactive bridge pattern the canvas components use (lib/hud.ts et al.)
 * to keep per-frame data out of React's render path. The only reactive
 * subscription here is `beat`, which changes a handful of times per page.
 */
export function ScrollProgress() {
  const beat = useScroll((s) => s.beat);
  const fillRef = useRef<HTMLSpanElement>(null);
  const activeIndex = chapterIndexForBeat(beat);
  const current = CHAPTERS[activeIndex];
  const next = CHAPTERS[activeIndex + 1];

  useEffect(() => {
    const apply = (progress: number) => {
      const el = fillRef.current;
      if (el) el.style.transform = `scaleY(${Math.min(1, Math.max(0, progress))})`;
    };
    apply(useScroll.getState().progress);
    return useScroll.subscribe((state) => apply(state.progress));
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed right-8 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-4 sm:flex"
    >
      <span className="font-sans text-[10px] tabular-nums tracking-[0.2em] text-[#C9A227]">
        {current.number}
      </span>
      <span className="relative h-28 w-px bg-white/12">
        <span
          ref={fillRef}
          style={{ transform: "scaleY(0)" }}
          className="absolute inset-0 origin-top bg-[#C9A227]"
        />
      </span>
      <span className="font-sans text-[10px] tabular-nums tracking-[0.2em] text-white/25">
        {next ? next.number : "—"}
      </span>
    </div>
  );
}
