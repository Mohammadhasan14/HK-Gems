"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll } from "@/store/useScroll";
import { BEATS } from "@/lib/beats";
import { audio } from "@/lib/audio";

const ARRIVAL = BEATS.find((b) => b.id === "arrival")!;

/** Bar heights of the sound icon's waveform, as fractions of its box. */
const WAVE_BARS = [0.35, 0.75, 1, 0.55, 0.8];

function SoundToggle() {
  const [on, setOn] = useState(audio.enabled);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !on;
        audio.enabled = next;
        setOn(next);
      }}
      aria-pressed={on}
      className="group flex items-center gap-3 font-sans text-[10px] uppercase tracking-[0.28em] text-white/45 transition-colors duration-300 hover:text-white/80"
    >
      <span>Sound</span>
      <span aria-hidden="true" className="flex h-3 items-center gap-[2px]">
        {WAVE_BARS.map((h, i) => (
          <span
            key={i}
            style={{ height: `${(on ? h : 0.18) * 100}%` }}
            className={`w-[1.5px] transition-all duration-300 ${
              on ? "bg-[#C9A227]" : "bg-white/35"
            }`}
          />
        ))}
      </span>
    </button>
  );
}

/**
 * The hero's footer row: sound control left, the invitation to scroll
 * centred, and a scroll affordance right. Present only on the opening
 * chapter — it has one job and shouldn't linger once it's done.
 *
 * Fades out over the first stretch of Arrival by writing opacity to the DOM
 * from a transient store subscription, rather than re-rendering on every
 * frame of scroll (same reason as ScrollProgress).
 */
export function HeroFooter() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (progress: number) => {
      const el = ref.current;
      if (!el) return;
      // Gone by a third of the way through Arrival.
      const t = Math.min(1, progress / (ARRIVAL.end * 0.33));
      el.style.opacity = String(1 - t);
      // Fully out of the tree for hit-testing once invisible, so the sound
      // control can't be tabbed to or clicked from a later scene.
      el.style.visibility = t >= 1 ? "hidden" : "visible";
    };
    apply(useScroll.getState().progress);
    return useScroll.subscribe((state) => apply(state.progress));
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 bottom-8 z-30 flex items-end justify-between px-6 sm:px-10"
    >
      <div className="hidden sm:block">
        <SoundToggle />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.38em] text-white/45">
          Scroll to begin
        </span>
        <span className="h-9 w-px bg-gradient-to-b from-white/35 to-transparent" />
        <span className="h-[5px] w-[5px] rounded-full border border-white/40" />
      </div>

      <span
        aria-hidden="true"
        className="ml-auto hidden items-center gap-3 font-sans text-[10px] uppercase tracking-[0.28em] text-white/45 sm:flex"
      >
        Scroll
        <svg viewBox="0 0 10 22" className="h-5 w-[10px]" fill="none" aria-hidden="true">
          <path
            d="M5 0v20M1 16l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
