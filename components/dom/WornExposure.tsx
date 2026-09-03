"use client";

import { useEffect, useRef } from "react";
import { BEATS } from "@/lib/beats";
import { useScroll } from "@/store/useScroll";

const WORN = BEATS.find((b) => b.id === "worn")!;
const COLLECTION = BEATS.find((b) => b.id === "collection")!;
// How much of Collection's own range the wash takes to fade back out —
// small, so it clears quickly and doesn't eat into the turntable beat.
const FADE_OUT_SPAN = (COLLECTION.end - COLLECTION.start) * 0.08;

function exposureOpacity(progress: number): number {
  if (progress <= WORN.start) return 0;
  if (progress < WORN.end) {
    // Reaches full exposure a little before the beat's own end, so the CTA
    // at the bottom of the beat reads against the fully blown-out wash
    // rather than mid-transition.
    return Math.min(1, (progress - WORN.start) / (WORN.end - WORN.start) / 0.85);
  }
  // Past Worn: stays fully exposed through the boundary, then fades back
  // out across the start of Collection so its near-black background (and
  // white-on-dark placards) can return — without this, the wash never
  // clears and Collection's text is invisible against it.
  return Math.max(0, 1 - (progress - WORN.end) / FADE_OUT_SPAN);
}

/**
 * Beat 6's "the 3D exits by overexposing to warm white" — a fixed
 * full-viewport wash between the persistent Canvas (z-0, CanvasRoot.tsx)
 * and the DOM text layer, opacity driven by scroll position within Worn
 * only. DOM-based rather than a real bloom/exposure postprocess pass
 * specifically so it costs the same (near nothing) on every quality tier —
 * this beat's read must survive LOW tier exactly as well as HIGH.
 *
 * Same z-0 + DOM-order stacking as CanvasRoot.tsx (not a higher z-index):
 * this renders between CanvasRoot and `<main>` in SiteShell.tsx, so at
 * equal z-index it paints above the canvas but still below the beat text —
 * a literal z-index above 0 would paint over the text instead.
 *
 * Beat6Worn.tsx's headline keeps a dark text-shadow so it stays legible
 * once the wash is bright, rather than needing a scroll-synced color swap.
 */
export function WornExposure() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (overlayRef.current) {
        const { progress } = useScroll.getState();
        overlayRef.current.style.opacity = String(exposureOpacity(progress));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-0 bg-[#fff4dd] opacity-0"
      aria-hidden="true"
    />
  );
}
