"use client";

import { useEffect, useRef } from "react";
import { useScroll } from "@/store/useScroll";
import { BEATS } from "@/lib/beats";
import { CHAPTERS, chapterIndexForBeat } from "@/lib/journey";

/** Scroll range each chapter spans, derived from the beats it covers. */
const CHAPTER_RANGES = CHAPTERS.map((chapter) => {
  const owned = BEATS.filter((b) => chapter.beats.includes(b.id));
  return {
    start: Math.min(...owned.map((b) => b.start)),
    end: Math.max(...owned.map((b) => b.end)),
  };
});

/** Fraction of the track the travelling gold segment occupies. */
const SEGMENT_FRACTION = 0.26;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The right-hand progress hairline: the chapter you are in, a thin rule with
 * a short gold segment travelling down it, and the chapter you are heading
 * into. Deliberately the quietest element on screen — it must never compete
 * with the stone.
 *
 * A travelling SEGMENT rather than a filling bar, because the numbers either
 * side of it already say where you are in the whole film; this says where
 * you are inside the current scene. A bar that filled from the top would be
 * saying the same thing twice, and would read as a loading indicator.
 *
 * Progress changes every frame, so this does NOT subscribe to it through
 * React. It takes the store's transient subscription and writes `transform`
 * straight onto the segment — the same non-reactive bridge pattern the
 * canvas components use (lib/hud.ts et al.) to keep per-frame data out of
 * React's render path. The only reactive subscription is `beat`, which
 * changes a handful of times per page.
 */
export function ScrollProgress() {
  const beat = useScroll((s) => s.beat);
  const segmentRef = useRef<HTMLSpanElement>(null);
  const activeIndex = chapterIndexForBeat(beat);
  const isLast = activeIndex === CHAPTERS.length - 1;

  useEffect(() => {
    const apply = (progress: number) => {
      const el = segmentRef.current;
      if (!el) return;
      const { start, end } = CHAPTER_RANGES[activeIndex];
      const local = Math.min(1, Math.max(0, (progress - start) / (end - start)));
      // Travel across the part of the track the segment does not occupy, so
      // it comes to rest flush with the bottom rather than overshooting it.
      const travel = (1 - SEGMENT_FRACTION) * 100 * local;
      el.style.transform = `translateY(${travel}%)`;
    };
    apply(useScroll.getState().progress);
    return useScroll.subscribe((state) => apply(state.progress));
  }, [activeIndex]);

  return (
    <div
      aria-hidden="true"
      // Same reason as StoryNav's shadow: survives Beat 5's white wash.
      style={{ textShadow: "0 1px 10px rgba(8,8,10,0.9)" }}
      className="fixed right-10 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-5 sm:flex"
    >
      <span className="font-sans text-[10px] tabular-nums tracking-[0.2em] text-[#C9A227]">
        {pad(activeIndex)}
      </span>
      {/* Track and next-chapter numeral use the same mid warm grey as
          StoryNav's inactive labels, for the same reason: this is fixed
          chrome over a background that inverts at Beat 5, and pale-on-dark
          values vanish entirely once the frame blows out to warm white. */}
      <span className="relative h-24 w-px bg-[#8b8578]/35">
        <span
          ref={segmentRef}
          style={{ height: `${SEGMENT_FRACTION * 100}%`, transform: "translateY(0%)" }}
          className="absolute inset-x-0 top-0 block bg-[#C9A227]"
        />
      </span>
      <span className="font-sans text-[10px] tabular-nums tracking-[0.2em] text-[#8b8578]">
        {isLast ? "—" : pad(activeIndex + 1)}
      </span>
    </div>
  );
}
