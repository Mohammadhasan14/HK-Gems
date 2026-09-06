"use client";

import { useScroll } from "@/store/useScroll";
import { CHAPTERS, chapterIndexForBeat } from "@/lib/journey";
import { getLenis } from "@/lib/lenisBridge";

/**
 * The left-hand journey rail — where the visitor is in the seven chapters
 * (lib/journey.ts). Editorial, not a dashboard: hairline connector, small
 * caps, and a single restrained gold accent on the active chapter. Nothing
 * fills, pulses or glows.
 *
 * Subscribes to `beat` (which changes a handful of times across the entire
 * page) rather than `progress` (which changes every frame) — the rail must
 * never be a source of 60fps React re-renders behind the canvas. The
 * continuous, per-frame half of this UI is components/dom/ScrollProgress.tsx,
 * which writes to the DOM directly for exactly that reason.
 *
 * Desktop only. On small screens the rail would eat the width the stone and
 * headline need; ScrollProgress carries the "where am I" job there instead.
 */
export function StoryNav() {
  const beat = useScroll((s) => s.beat);
  const activeIndex = chapterIndexForBeat(beat);

  return (
    <nav
      aria-label="Story chapters"
      // The text-shadow is doing real work, not decoration: Beat 6 washes
      // the frame to warm white, and pale labels vanish into it. A dark
      // shadow holds them without needing a panel behind the rail.
      style={{ textShadow: "0 1px 10px rgba(8,8,10,0.9)" }}
      className="fixed left-8 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
    >
      <ol className="relative flex flex-col gap-7">
        {/* Connector, inset to run through the middle of the markers. */}
        <span
          aria-hidden="true"
          className="absolute left-[11px] top-2 bottom-2 w-px bg-white/12"
        />
        {CHAPTERS.map((chapter, i) => {
          const active = i === activeIndex;
          return (
            <li key={chapter.anchor} className="relative">
              <button
                type="button"
                onClick={() => getLenis().scrollTo(`#${chapter.anchor}`)}
                aria-current={active ? "step" : undefined}
                className="group flex items-center gap-4 text-left"
              >
                <span
                  className={`relative z-10 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border font-sans text-[9px] tabular-nums transition-colors duration-500 ${
                    active
                      ? "border-[#C9A227] bg-[#08080A] text-[#C9A227]"
                      : "border-white/15 bg-[#08080A] text-white/35 group-hover:border-white/35 group-hover:text-white/60"
                  }`}
                >
                  {chapter.number}
                </span>
                <span
                  className={`font-sans text-[10px] uppercase tracking-[0.22em] transition-colors duration-500 ${
                    active
                      ? "text-[#C9A227]"
                      : "text-white/35 group-hover:text-white/70"
                  }`}
                >
                  {chapter.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
