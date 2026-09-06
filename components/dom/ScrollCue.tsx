"use client";

import { useEffect, useRef } from "react";
import { useScroll } from "@/store/useScroll";
import { BEATS } from "@/lib/beats";

const ARRIVAL = BEATS.find((b) => b.id === "arrival")!;

/**
 * The invitation to start scrolling, centred at the foot of the hero. Fades
 * out over the first stretch of Arrival and never returns — it has one job
 * and shouldn't linger once it's done.
 *
 * Like ScrollProgress, it writes opacity to the DOM from a transient store
 * subscription rather than re-rendering on every frame of scroll.
 */
export function ScrollCue() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (progress: number) => {
      const el = ref.current;
      if (!el) return;
      // Gone by a third of the way through Arrival.
      const t = Math.min(1, progress / (ARRIVAL.end * 0.33));
      el.style.opacity = String(1 - t);
      el.style.visibility = t >= 1 ? "hidden" : "visible";
    };
    apply(useScroll.getState().progress);
    return useScroll.subscribe((state) => apply(state.progress));
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-9 z-30 flex flex-col items-center gap-3"
    >
      <span className="font-sans text-[9px] uppercase tracking-[0.42em] text-white/40">
        Scroll to begin
      </span>
      <span className="h-10 w-px bg-gradient-to-b from-[#C9A227]/70 to-transparent" />
    </div>
  );
}
