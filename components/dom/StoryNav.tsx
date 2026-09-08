"use client";

import { useScroll } from "@/store/useScroll";
import { CHAPTERS, chapterIndexForBeat } from "@/lib/journey";
import { getLenis } from "@/lib/lenisBridge";

/**
 * The left-hand journey rail — where the visitor is in the seven chapters
 * (lib/journey.ts).
 *
 * Editorial, not a dashboard. The parts that carry that: a hairline
 * connector running THROUGH the markers rather than beside them, markers
 * that are outline-only until active, a single gold accent, and no fill,
 * pulse or glow anywhere. The active marker gains a gold ring and its label
 * gold text; nothing else changes, which is what keeps the rail quiet enough
 * to sit next to the stone for the whole scroll.
 *
 * Subscribes to `beat` (a handful of changes across the entire page) rather
 * than `progress` (every frame) — the rail must never be a source of 60fps
 * React re-renders behind the canvas. The continuous half of this UI is
 * components/dom/ScrollProgress.tsx, which writes to the DOM directly for
 * exactly that reason.
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
      // The text shadow is doing real work, not decoration: Beat 5 washes
      // the frame to warm white, and pale labels vanish into it.
      style={{ textShadow: "0 1px 10px rgba(8,8,10,0.9)" }}
      className="fixed left-10 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
    >
      <ol className="relative flex flex-col gap-[1.85rem]">
        {/* Connector, inset to run through the middle of the markers. */}
        <span
          aria-hidden="true"
          className="absolute left-[9px] top-3 bottom-3 w-px bg-white/15"
        />
        {CHAPTERS.map((chapter, i) => {
          const active = i === activeIndex;
          return (
            <li key={chapter.anchor} className="relative">
              <button
                type="button"
                onClick={() => getLenis().scrollTo(`#${chapter.anchor}`)}
                aria-current={active ? "step" : undefined}
                className="group flex items-center gap-5 text-left"
              >
                <span
                  className={`relative z-10 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border bg-[#08080A] font-sans text-[9px] tabular-nums transition-colors duration-500 ${
                    active
                      ? "border-[#C9A227] text-[#C9A227]"
                      : "border-[#8b8578]/45 text-[#8b8578] group-hover:border-[#8b8578] group-hover:text-white"
                  }`}
                >
                  {chapter.number}
                </span>
                <span
                  // A mid warm grey, not white/40. The rail is fixed chrome
                  // over a background that inverts: Beat 5 blows the frame
                  // out to warm white, and pale labels disappeared into it
                  // for that entire beat, taking the site's main navigation
                  // with them. This tone is dark enough to read on the cream
                  // wash and light enough to read on the near-black set, so
                  // it survives both without needing to be driven per frame.
                  // Gold does the same, which is why the active state is
                  // already safe.
                  className={`font-sans text-[10px] uppercase tracking-[0.24em] transition-colors duration-500 ${
                    active
                      ? "text-[#C9A227]"
                      : "text-[#8b8578] group-hover:text-white"
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
